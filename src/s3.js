'use strict';

const fs = require('fs');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({ params: { Bucket: 'spotifypreviewmp3sforalexa' } });

module.exports.save = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false; //<---Important

    const uploadParams = {
        Key: 'testfile',
        Body: fs.readFileSync('package.json')
    };
    s3.upload(uploadParams, (err, data) => {
        if (err) {
            console.error('Could not create s3 bucket', err);
            handleError(500, err.message, callback);
        } else {
            console.log('S3 bucket created', data);
            handleSuccess('S3 bucket created ' + JSON.stringify(data), callback);
        }
    })
};

const handleRedirect = (url, callback) => {
    const response = {
        statusCode: 301,
        headers: {
            Location: url
        },
        body: ''
    };
    callback(null, response);
};

const handleSuccess = (data, callback) => {
    const response = {
        statusCode: 200,
        body: JSON.stringify(data)
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
