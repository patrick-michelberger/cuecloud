'use strict';

const fs = require('fs');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({ params: { Bucket: 'spotify-preview-mp3s-for-alexa' } });

/*
 * Upload a file to s3 a get the public url as object in the callback
 */
const uploadFile = (fileUrl, fileName, callback) => {
    const s3FileParams = {
        Key: fileName,
        Body: fs.readFileSync(fileUrl)
    };
    s3.upload(s3FileParams, (err, data) => {
        if (err) {
            console.error('Error uploading file to S3   ', err);
            callback(err, null);
        } else {
            callback(null, data.Location);
        }
    })
};

module.exports = {
    uploadFile
};
