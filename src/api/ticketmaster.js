'use strict';

const request = require('request-promise');
const config = require("../config/config.json");
const spotify = require('spotify');

const fetchTicketmasterEvents = (location, page: 0) => {
    const TICKETMASTER_URL = 'https://app.ticketmaster.com/discovery/v2/events.json?' +
        'apikey=' + config.ticketmaster.apiKey +
        '&city=' + location +
        '&classificationName=Music' +
        '&page=' + page;

    const options = {
        method: 'get',
        url: TICKETMASTER_URL
    };

    return request(options)
        .then(function(body) {
            body = JSON.parse(body);
            const page = body.page;
            let events = [];

            if (body._embedded) {
                events = body._embedded.events || [];
            }
            const result = {
                page: page,
                events: events
            };
            return events;
        })
        .then(events => {
            // add spotify id for each artist
            const artistCalls = [];
            events.forEach((event) => {
                event.artist = {};
                if (event._embedded && event._embedded.attractions && event._embedded.attractions[0]) {
                    event.artist.name = event._embedded.attractions[0].name;
                    artistCalls.push(spotify.getArtistId(event._embedded.attractions[0].name));
                }
            });
            return Promise.all(artistCalls)
                .then((artistIds) => {
                    for (let i = 0; i < events.length; i++) {
                        events[i].artist.spotifyId = artistIds[i];
                    }
                    return events;
                });
        })
        .then(events => {
            // add spotify preview url for each artist
            const trackCalls = [];
            events.forEach((event) => {
                if (event.artist && event.artist.spotifyId) {
                    trackCalls.push(spotify.getArtistTopTrackPreviewUrl(event.artist.spotifyId));
                }
            });
            return Promise.all(trackCalls).then((previewUrls) => {
                for (let i = 0; i < events.length; i++) {
                    events[i].artist.previewUrl = previewUrls[i];
                }
                return events;
            });
        });
};

module.exports = {
    fetchTicketmasterEvents
};
