'use strict';

const admin = require("firebase-admin");
const config = require("../config/config.json");
const path = require('path');
const request = require('request');
const AWS = require('aws-sdk');
const ses = new AWS.SES();
const lambda = require('../api/lambda');

const FIREBASE_ADMIN_CREDENTIALS = admin.credential.cert(path.join(__dirname, "./config/firebase-admin.json"));

const send = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false; //<---Important

    const body = JSON.parse(event.body);

    const email = body.receiverEmail;
    if (!email) {
        handleError(400, "Missing receiverEmail.", callback);
    }

    const message = body.message;
    if (!message) {
        handleError(400, "Missing message.", callback);
    }

    // Initialize Firebase
    if (admin.apps.length == 0) { // <---Important!!! In lambda, it will cause double initialization.
        admin.initializeApp({
            credential: FIREBASE_ADMIN_CREDENTIALS,
            databaseURL: config.firebase.databaseURL,
        })
    }

    sendEmail(event, email, message, (error) => {
        if (error) {
            lambda.handleErrorResponse(400, error, callback);
        } else {
            lambda.handleJsonResponse(200, "Email sent", callback);
        }
    });

    // const ref = admin.database().ref('users/' + senderId);
    // ref.once("value").then((snapshot) => {
    //     const receiver = snapshot.val();
    //     if (!receiver) {
    //         lambda.handleErrorResponse(400, 'No user found', callback);
    //     } else {
    //         sendEmail(event, receiver, "pmichelberger@gmail.com", (error) => {
    //             if (error) {
    //                 lambda.handleErrorResponse(400, error, callback);
    //             } else {
    //                 lambda.handleJsonResponse(200, "Email sent", callback);
    //             }
    //         });
    //     }
    // }).catch((error) => {
    //     lambda.handleErrorResponse(400, error, callback);
    // });
};

module.exports = {
    send
};

const sendEmail = (event, email, message, done) => {
    const params = {
        Destination: {
            ToAddresses: [
                email
            ]
        },
        Message: {
            Body: {
                Html: {
                    Data: message,
                    Charset: 'UTF-8'
                }
            },
            Subject: {
                Data: 'Cuecloud: Concert Recommendation',
                Charset: 'UTF-8'
            }
        },
        Source: "pmichelberger@gmail.com"
    };
    ses.sendEmail(params, done);
};

const sendTextEmail = (event, email, message, done) => {
    const params = {
        Destination: {
            ToAddresses: [
                email
            ]
        },
        Message: {
            Body: {
                Text: {
                    Data: message
                }
            },
            Subject: {
                Data: 'Cuecloud: Concert Recommendation',
                Charset: 'UTF-8'
            }
        },
        Source: "pmichelberger@gmail.com"
    };
    ses.sendEmail(params, done);
};
