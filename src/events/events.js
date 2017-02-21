'use strict';

const eventful = require('../api/eventful');
const lambda = require('../api/aws-lambda');
const spotify = require('../api/spotify');
const songs = require('../songs/songs');

const fetchEvents = (location, genre) => {
    return eventful.getEventsByLocation(location)
        .then(events => {
            // add spotify preview url for each artist
            const trackCalls = [];
            events.forEach((event) => {
                // todo separate getting url from spotify and saving on s3. songs.getPre... should only save on s3
                trackCalls.push(songs.getPreviewTrackUrl(event.artist));
            });
            return Promise.all(trackCalls).then((previewUrls) => {
                for (let i = 0; i < events.length; i++) {
                    events[i].topTrackPreviewUrl = previewUrls[i];
                }
                return events;
            });
        }).catch((error) => {
            console.log('Error getting events', error);
        });
};

module.exports = {
    fetchEvents
};
