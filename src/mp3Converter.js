'use strict';

const fs = require('fs');
const spawn = require('child_process').spawn;
const url = require('url');
const spotify = require('./spotify');
const s3 = require('./s3');

const FFMPEG_BIN = './bin/ffmpeg_linux64';
const RESULT_DIR = '/tmp';

module.exports.convert = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false; //<---Important

    // const mp3Url = event.query.mp3Url;
    const previewMp3Url = 'https://p.scdn.co/mp3-preview/d0a77a3229af6dc37420db230c92d5d96a2da780';
    const previewMp3FileName = spotify.getIdFromPreviewUrl(previewMp3Url) + '.mp3';

    if (!previewMp3Url) {
        handleError(400, "No valid spotify preview url", callback);
    }

    console.log('Converting ' + previewMp3Url);

    const convertedFileUri = RESULT_DIR + '/' + previewMp3FileName;

    convertMp3(previewMp3Url, convertedFileUri, (error) => {
        if (error) {
            console.error('Conversion failed', previewMp3Url, error);
            handleError(400, 'Conversion failed + ' + error, callback);
        } else {
            logFileStats(convertedFileUri);
            s3.uploadFile(convertedFileUri, previewMp3FileName, (err, publicUrl) => {
                if (err) {
                    console.log('Upload to S3 failed', err);
                    handleError(500, 'Upload to S3 failed ' + err, callback)
                } else {
                    handlePermanentRedirect(publicUrl, callback);
                }
            })
        }
    })
};

const logFileStats = (fileUri) => {
    const stats = fs.statSync(fileUri);
    const fileSizeInBytes = stats["size"];
    const fileSizeInMegabytes = parseFloat(fileSizeInBytes / 1000000).toFixed(3);
    console.log(`${fileUri}  size: ${fileSizeInMegabytes}mb`);
};

const convertMp3 = (mp3Link, resultUri, callback) => {
    spawn(FFMPEG_BIN, [
        '-i', mp3Link,
        '-b:a', '48k',
        '-y',
        '-ar', '16000',
        resultUri
    ])
        .on('message', msg => console.log(msg))
        .on('error', error => callback(error))
        .on('close', () => callback(null));
};

const handlePermanentRedirect = (url, callback) => {
    const response = {
        statusCode: 301,
        headers: {
            Location: url
        },
        body: ''
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
