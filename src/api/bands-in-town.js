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

const fetchEvents = (location, genre) => {
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

module.exports = {
    recommendEventsByArtist,
    fetchEvents
};
