'use strict'

const request = require('request-promise');
const config = require("../config/config.json");
const spotify = require('../spotify');

let EventService = {};

EventService.recommendEventsByArtist = (artist, location) => {
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

EventService.fetchBandsintownEvents = (location, genre) => {
    return spotify.getArtistsByGenre([genre])
        .then((artists) => {
            console.log("found artists: ", artists);
            let eventCalls = [];
            artists.forEach((artist) => {
                eventCalls.push(EventService.recommendEventsByArtist(artist, location));
            });
            return Promise.all(eventCalls.map(p => p.catch(e => {
                console.log("error: ", e);
                return [];
            })))
                .then((events) => {
                    const flatten = arr => arr.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
                    const unique = (arrArg) => {
                        return arrArg.filter((elem, pos, arr) => {
                            return arr.indexOf(elem) == pos;
                        });
                    };
                    return unique(flatten(events));
                }).then((events) => {
                    // add spotify id for each artist
                    const artistCalls = [];
                    events.forEach((event) => {
                        artistCalls.push(spotify.getArtistId(event.artists[0].name));
                    });
                    return Promise.all(artistCalls)
                        .then((artistIds) => {
                            for (let i = 0; i < events.length; i++) {
                                events[i].artist_spotify_id = artistIds[i];
                            }
                            return events;
                        });
                })
                .then(events => {
                    // add spotify preview url for each artist
                    const trackCalls = [];
                    events.forEach((event) => {
                        trackCalls.push(spotify.getArtistTopTrackPreviewUrl(event.artist_spotify_id));
                    });
                    return Promise.all(trackCalls).then((previewUrls) => {
                        for (let i = 0; i < events.length; i++) {
                            events[i].artist_spotify_preview_url = previewUrls[i];
                        }
                        return events;
                    });
                }).catch((error) => {
                    console.log("error: populating events: ", error);
                });
        }).catch((error) => {
            console.log("error: fetching artists: ", error);
        });
};

EventService.fetchTicketmasterEvents = (location, page) => {
    page = page || 0;
    const TICKETMASTER_URL = 'https://app.ticketmaster.com/discovery/v2/events.json?apikey=' + config.ticketmaster.apiKey + '&city=' + location + '&classificationName=Music' + '&page=' + page;

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

module.exports = EventService;
