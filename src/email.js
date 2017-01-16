'use strict'

/**
 *  Dependencies
 */
const admin = require("firebase-admin");
const config = require("./config/config.json");
const path = require('path');
const request = require('request');
const AWS = require('aws-sdk');
const ses = new AWS.SES();

const FIREBASE_ADMIN_CREDENTIALS = admin.credential.cert(path.join(__dirname, "./config/firebase-admin.json"));

/**
 *  Handlers
 */
module.exports.send = function(event, context, callback) {
    context.callbackWaitsForEmptyEventLoop = false; //<---Important

    const body = JSON.parse(event.body);

    const receiver = body.receiver;
    if (!receiver) {
        handleError(400, "Missing receiver.", callback);
    }

    const senderId = body.senderId;
    if (!senderId) {
        handleError(400, "Missing senderId.", callback);
    }

    // Initialize Firebase
    if (admin.apps.length == 0) { // <---Important!!! In lambda, it will cause double initialization.
        admin.initializeApp({
            credential: FIREBASE_ADMIN_CREDENTIALS,
            databaseURL: config.firebase.databaseURL,
        })
    }

    const ref = admin.database().ref('users/' + senderId);
    ref.once("value").then((snapshot) => {
        const receiver = snapshot.val();
        if (!receiver) {
            handleError(400, 'No user found', callback);
        } else {
            sendEmail(event, receiver, "pmichelberger@gmail.com", (error) => {
                if (error) {
                    handleError(400, error, callback);
                } else {
                    handleResponse(200, "Email sent", callback);
                }
            });
        }
    }).catch((error) => {
        handleError(400, error, callback);
    });
};

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
};

const sendEmail = (event, receiver, sender, done) => {
    const params = {
        Destination: {
            ToAddresses: [
                receiver.email
            ]
        },
        Message: {
            Body: {
                Text: {
                    Data: 'Hi ' + receiver.displayName + ', \nyour requested concert link for José González & The String Theory</b>' +
                        '\nyour requested concert link for José González & The String Theory: http://www.ticketmaster.de/event/200921' +
                        '\nHave fun!' +
                        '\nAlexa'
                }
            },
            Subject: {
                Data: 'Cuecloud: Concert Recommendation',
                Charset: 'UTF-8'
            }
        },
        Source: sender
    };
    ses.sendEmail(params, done);
};
