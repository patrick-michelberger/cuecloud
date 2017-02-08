'use strict';

const request = require('request-promise');
const spotify = require('./spotify');

const recommendEventsByArtist = (artist, location) => {
    const url = 'http://api.bandsintown.com/artists/' + artist + '/events/recommended?location=' + location + '&radius=50&app_id=cuecloud&api_version=2.0&format=json';
    const options = {
        method: 'get',
        url: url
    };
    return request(options)
        .then((data) => {
            const events = JSON.parse(data) || [];
            return events;
        });
};

module.exports = {
    recommendEventsByArtist
};
