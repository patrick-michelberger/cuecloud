'use strict';

const fs = require('fs');
const spawn = require('child_process').spawn;
const lambda = require('../api/aws-lambda');
const randomId = require('random-id');

const FFMPEG_BIN = '../bin/ffmpeg_linux64';
const RESULT_DIR = '/tmp';

/**
 * Convert a mp3 to 48k and 16khz
 *
 * @param mp3ToConvertUri uri to the file to convert
 * @returns {Promise} with converted file uri
 */
const convert = (mp3ToConvertUri) => {
    return new Promise((resolve, reject) => {
        if (!mp3ToConvertUri) {
            reject(new Error('No uri to convert'));
        }

        console.log('Converting ' + mp3ToConvertUri);

        const resultFileName = randomId(0, '0') + '.mp3';
        const resultFileUri = RESULT_DIR + '/' + resultFileName;

        convertMp3(mp3ToConvertUri, resultFileUri, (error) => {
            if (error) {
                reject(error);
            }
            //logFileStatsAsync(resultFileUri);
            resolve(resultFileUri)
        });

    });
};

module.exports = {
    convert
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

const logFileStatsAsync = (fileUri) => {
    fs.stat(fileUri, (err, stats) => {
        if (err || !stats) {
            console.log('No file stats for ' + fileUri, err);
            return;
        }
        const fileSizeInBytes = stats["size"];
        const fileSizeInMegabytes = parseFloat(fileSizeInBytes / 1000000).toFixed(3);
        console.log(`File stats for ${fileUri}: size: ${fileSizeInMegabytes}mb`);
    });
};
