'use strict'

/**
 *  Dependencies
 */
const admin = require("firebase-admin");
const fs = require('fs');
const path = require('path');
const loginHtml = fs.readFileSync('./templates/index.html', "utf8");
const randomID = require('random-id')
const jwt = require('jsonwebtoken');
const config = require("./config/config.json");

const FIREBASE_ADMIN_CREDENTIALS = admin.credential.cert(path.join(__dirname, "./config/firebase-admin.json"));

/**
 *  Handlers
 */
module.exports.showLoginPage = function(event, context, callback) {
    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html'
        },
        body: loginHtml
    };
    callback(null, response);
};

module.exports.authorizeToken = function(event, context, callback) {
    context.callbackWaitsForEmptyEventLoop = false; //<---Important

    // Initialize Firebase
    if (admin.apps.length == 0) { // <---Important!!! In lambda, it will cause double initialization.
        admin.initializeApp({
            credential: FIREBASE_ADMIN_CREDENTIALS,
            databaseURL: config.firebase.databaseURL,
        })
    }

    const original_token = event.queryStringParameters.token;
    const uid = event.queryStringParameters.uid;

    if (!original_token) {
        handleError(422, "Missing token query parameter.", callback);
    } else if (!uid) {
        handleError(422, "Missing uid query parameter.", callback);
    } else {
        admin.auth()
            .verifyIdToken(original_token)
            .then(tokend => {
                if (!tokend.email) {
                    handleError(400, "No email address associated with this account", callback);
                } else {
                    const token = randomID(6, "0");
                    admin.database().ref(`tokens/${token}`).set({
                        token: token,
                        uid: uid,
                        created: admin.database.ServerValue.TIMESTAMP
                    }).then((data) => {
                        handleResponse(200, token, callback);
                    }).catch((error) => {
                        handleError(400, "Error occurred generating token.", callback);
                    });
                }
            });
    }
};

module.exports.authorizeByCode = function(event, context, callback) {
    context.callbackWaitsForEmptyEventLoop = false; //<---Important

    const client_id = event.queryStringParameters.client_id;
    if (!client_id) {
        handleError(400, "Missing client_id query parameter.", callback);
    } else if (client_id !== config.alexa.client_id) {
        handleError(400, `Expected client_id to be ${config.alexa.client_id}`, callback);
    }

    const response_type = event.queryStringParameters.response_type;
    if (!response_type) {
        handleError(400, "Missing response_type query parameter.", callback);
    } else if (response_type !== "token") {
        handleError(400, "Wrong response_type query parameter.", callback);
    }

    const state = event.queryStringParameters.state;
    if (!state) {
        handleError(400, "Missing state query parameter.", callback);
    }

    const code = event.queryStringParameters.code;
    if (!code) {
        handleError(400, "Missing code query parameter.", callback);
    }

    // Initialize Firebase
    if (admin.apps.length == 0) { // <---Important!!! In lambda, it will cause double initialization.
        admin.initializeApp({
            credential: FIREBASE_ADMIN_CREDENTIALS,
            databaseURL: config.firebase.databaseURL,
        })
    }

    const ref = admin.database().ref('tokens/' + code);
    ref.once("value").then((snapshot) => {
        const d = snapshot.val();
        return ref.remove().then(() => {
            jwt.sign({
                "uid": d.uid
            }, config.jwtSecret, {}, (error, final_token) => {
                if (error) {
                    handleError(400, `Could not make JWT`, callback);
                } else {
                    const return_url =
                        config.alexa.redirect +
                        "#state=" + state +
                        "&access_token=" + final_token +
                        "&token_type=Bearer";
                    handleRedirectResponse(return_url, callback);
                }
            });
        })
    }).catch((error) => {
        console.log("error: ", error);
        handleError(400, error, callback);
    });
}


module.exports.decodeAccessToken = (accessToken) => {

    if (admin.apps.length == 0) { // <---Important!!! In lambda, it will cause double initialization.
        admin.initializeApp({
            credential: FIREBASE_ADMIN_CREDENTIALS,
            databaseURL: config.firebase.databaseURL,
        })
    }

    return new Promise((resolve, reject) => {
        jwt.verify(accessToken, config.jwtSecret, {}, (error, decoded) => {
            if (error ||  !decoded ||  !decoded.uid) {
                return reject(error);
            }
            const ref = admin.database().ref('users/' + decoded.uid);
            ref.once("value").then((snapshot) => {
                const d = snapshot.val();
                resolve({
                    displayName: d.displayName,
                    uid: d.uid,
                    email: d.email
                });
            }).catch((error) => {
                reject(error);
            });
        });
    });
}

/**
 *  Helpers
 */
const handleResponse = (status, data, callback) => {
    const response = {
        statusCode: status,
        body: JSON.stringify(data)
    };
    callback(null, response);
};

const handleRedirectResponse = (url, callback) => {
    const response = {
        statusCode: 302,
        headers: {
            "Location": url
        }
    };
    callback(null, response);
};

const handleError = (status, message, callback) => {
    const response = {
        statusCode: status,
        body: JSON.stringify({
            "message": message
        })
    };
    callback(null, response);
};;
