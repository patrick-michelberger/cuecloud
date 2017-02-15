'use strict';

const bandsInTown = require('../api/bands-in-town');
const lambda = require('../api/aws-lambda');
const spotify = require('../api/spotify');

const fetchEvents = (location, genre) => {
    // return spotify.getArtistsByGenre([genre])
    //     .then((artists) => {
            const artists = ['Flume', 'Disclosure'];
            console.log("found artists: ", artists);
            let eventCalls = [];
            artists.forEach((artist) => {
                eventCalls.push(bandsInTown.recommendEventsByArtist(artist, location));
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
        // }).catch((error) => {
        //     console.log("error: fetching artists: ", error);
        // });
};

module.exports = {
    fetchEvents
};
