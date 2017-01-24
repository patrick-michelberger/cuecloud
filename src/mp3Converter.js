'use strict';

const fs = require('fs');
const spawn = require('child_process').spawn;

const FFMPEG_BIN = './bin/ffmpeg_linux64';
const MP3_TEMP_FILE_URI = '/tmp/output.mp3';

module.exports.convert = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false; //<---Important

    // const mp3Url = event.query.mp3Url;
    const mp3Url = 'https://p.scdn.co/mp3-preview/d0a77a3229af6dc37420db230c92d5d96a2da780';
    if (!mp3Url) {
        handleError(400, "Missing receiver.", callback);
    }

    console.log('Converting ' + mp3Url);

    convertMp3(mp3Url, MP3_TEMP_FILE_URI, (error) => {
        if (error) {
            console.error('Could not convert ' + mp3Url, error);
            handleError(400, "Convertion failed. " + error, callback);
        } else {
            logFileStats(MP3_TEMP_FILE_URI);
            handleRedirect('https://google.com', callback);
        }
    })
};

const logFileStats = (fileUri) => {
    const stats = fs.statSync(fileUri);
    const fileSizeInBytes = stats["size"];
    //Convert the file size to megabytes (optional)
    const fileSizeInMegabytes = parseFloat(fileSizeInBytes / 1000000).toFixed(3);
    console.log(`${fileUri}  size: ${fileSizeInMegabytes}mb`);
};

const convertMp3 = (mp3Link, fileUri, callback) => {
    spawn(FFMPEG_BIN, [
        '-i', mp3Link,
        '-b:a', '48k',
        '-y',
        '-ar', '16000',
        fileUri
    ])
        .on('message', msg => console.log(msg))
        .on('error', error => callback(error))
        .on('close', () => callback(null));
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

const handleError = (status, message, callback) => {
    const response = {
        statusCode: status,
        body: JSON.stringify({
            "message": message
        })
    };
    callback(null, response);
};
