'use strict';

const mp3Converter = require('./mp3-converter');
const s3 = require('../api/aws-s3');
const spotify = require('../api/spotify');

const getPreviewTrackUrl = (artist) => {
    return spotify.getArtistId(artist)
        .then(artistId => spotify.getArtistTopTrackPreviewUrl(artistId))
        // TODO first check if file is already on s3
        .then(url => mp3Converter.convert(url))
        .then(fileUri => s3.uploadFile(fileUri, artist + '.mp3'));
};

module.exports = {
    getPreviewTrackUrl
};
