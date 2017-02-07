'use strict';

const fs = require('fs');
const execFile = require('child_process').execFile;
const lambda = require('../api/aws-lambda');
const randomId = require('random-id');

// the path must be relative to the root project src path for aws lambda. on local you
// need the relative path from the executing js script
const FFMPEG_BIN = './bin/ffmpeg_linux64';
const RESULT_DIR = '/tmp';

/**
 * Convert a mp3 to 48k and 16khz
 *
 * @param mp3ToConvertUri uri to the file to convert
 * @returns {Promise} with converted file uri
 */
const convert = (mp3ToConvertUri) => {
    return convertMp3(mp3ToConvertUri)
        .then(uri => logFileStats(uri))
        .catch(error => console.error('File could not be converted', error));
};

module.exports = {
    convert
};

const convertMp3 = (mp3Link) => {
    return new Promise((resolve, reject) => {
        console.log('Converting ' + mp3Link);

        const resultFileName = randomId(0, '0') + '.mp3';
        const resultFileUri = RESULT_DIR + '/' + resultFileName;

        execFile(FFMPEG_BIN, [
            '-i', mp3Link,
            '-b:a', '48k',
            '-y',
            '-ar', '16000',
            resultFileUri
        ], (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(resultFileUri);
        })
    })
};

const logFileStats = (fileUri) => {
    return new Promise((resolve, reject) => {
        fs.stat(fileUri, (err, stats) => {
            if (err || !stats) {
                reject('No file stats for ' + fileUri, err);
                return;
            }
            const fileSizeInBytes = stats["size"];
            const fileSizeInMegabytes = parseFloat(fileSizeInBytes / 1000000).toFixed(3);
            console.log(`File stats for ${fileUri}: size: ${fileSizeInMegabytes}mb`);
            resolve(fileUri);
        });
    });
};
