'use strict';

const admin = require("firebase-admin");
const fs = require('fs');
const path = require('path');
const loginHtml = fs.readFileSync('./login.html', "utf8");
const randomID = require('random-id');
const jwt = require('jsonwebtoken');
const config = require("./../config/config.json");
const lambda = require('../api/aws-lambda');

const FIREBASE_ADMIN_CREDENTIALS = admin.credential.cert(path.join(__dirname, "../config/firebase-admin.json"));

const showLoginPage = (event, context, callback) => {
    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html'
        },
        body: loginHtml
    };
    callback(null, response);
};

const authorizeToken = (event, context, callback) => {
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
        lambda.handleErrorResponse(422, "Missing token query parameter.", callback);
    } else if (!uid) {
        lambda.handleErrorResponse(422, "Missing uid query parameter.", callback);
    } else {
        admin.auth()
            .verifyIdToken(original_token)
            .then(tokend => {
                if (!tokend.email) {
                    lambda.handleErrorResponse(400, "No email address associated with this account", callback);
                } else {
                    const token = randomID(6, "0");
                    admin.database().ref(`tokens/${token}`).set({
                        token: token,
                        uid: uid,
                        created: admin.database.ServerValue.TIMESTAMP
                    }).then((data) => {
                        lambda.handleJsonResponse(200, token, callback);
                    }).catch((error) => {
                        lambda.handleErrorResponse(400, "Error occurred generating token.", callback);
                    });
                }
            });
    }
};

const authorizeByCode = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false; //<---Important

    const client_id = event.queryStringParameters.client_id;
    if (!client_id) {
        lambda.handleErrorResponse(400, "Missing client_id query parameter.", callback);
    } else if (client_id !== config.alexa.client_id) {
        lambda.handleErrorResponse(400, `Expected client_id to be ${config.alexa.client_id}`, callback);
    }

    const response_type = event.queryStringParameters.response_type;
    if (!response_type) {
        lambda.handleErrorResponse(400, "Missing response_type query parameter.", callback);
    } else if (response_type !== "token") {
        lambda.handleErrorResponse(400, "Wrong response_type query parameter.", callback);
    }

    const state = event.queryStringParameters.state;
    if (!state) {
        lambda.handleErrorResponse(400, "Missing state query parameter.", callback);
    }

    const code = event.queryStringParameters.code;
    if (!code) {
        lambda.handleErrorResponse(400, "Missing code query parameter.", callback);
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
                    lambda.handleErrorResponse(400, `Could not make JWT`, callback);
                } else {
                    const return_url =
                        config.alexa.redirect +
                        "#state=" + state +
                        "&access_token=" + final_token +
                        "&token_type=Bearer";
                    lambda.handleRedirectResponse(return_url, callback);
                }
            });
        })
    }).catch((error) => {
        console.log("error: ", error);
        lambda.handleErrorResponse(400, error, callback);
    });
};

const decodeAccessToken = (accessToken) => {

    if (admin.apps.length == 0) { // <---Important!!! In lambda, it will cause double initialization.
        admin.initializeApp({
            credential: FIREBASE_ADMIN_CREDENTIALS,
            databaseURL: config.firebase.databaseURL,
        })
    }

    return new Promise((resolve, reject) => {
        jwt.verify(accessToken, config.jwtSecret, {}, (error, decoded) => {
            if (error || !decoded || !decoded.uid) {
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
};

module.exports = {
    showLoginPage,
    authorizeToken,
    authorizeByCode,
    decodeAccessToken
};
