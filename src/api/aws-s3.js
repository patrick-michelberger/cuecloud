'use strict';

const fs = require('fs');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({ params: { Bucket: 'spotify-preview-mp3s-for-alexa' } });

/**
 * Upload a file to S3
 *
 * @param fileUri the file to upload
 * @param fileName the name of the file to upload
 * @returns {Promise} resolved with the location url
 */
const uploadFile = (fileUri, fileName) => {
    return new Promise((resolve, reject) => {
        const s3FileParams = {
            Key: fileName,
            Body: fs.readFileSync(fileUri)
        };
        s3.upload(s3FileParams, (err, data) => {
            if (err) {
                console.error('Error uploading file to S3', err);
                reject(err);
            } else {
                resolve(data.Location);
            }
        })
    });
};

/**
 * Check if file exists on bucket.
 *
 * @param fileName file to search on the bucket
 * @returns {Promise} resolve with true if file exists or false if file doesn't exist.
 * If the file exists the meta data will be the second argument.
 */
const fileExists = (fileName) => {
    return new Promise((resolve, reject) => {
        const s3FileParams = {
            Key: fileName
        };
        s3.headObject(s3FileParams, (err, data) => {
            if (err) {
                resolve(false);
            } else {
                resolve(true, data)
            }
        });
    })
};

const getFileUrl = (fileName) => {
    return new Promise((resolve, reject) => {
        const s3FileParams = {
            Key: fileName
        };
        s3.headObject(s3FileParams, (err, data) => {
            if (err) {
                reject(new Error('Could not find file ' + fileName + ' on S3.', err.statusCode));
            } else {
                s3.getSignedUrl('getObject', s3FileParams, (err, url) => {
                    resolve(removeParameterFromUrl(url));
                });
            }
        });
    })
};

module.exports = {
    uploadFile,
    fileExists,
    getFileUrl
};

const removeParameterFromUrl = (url) => {
    url = url || '';
    return url.substring(0, url.indexOf('?'));
};
