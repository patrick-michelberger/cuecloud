'use strict';

const request = require('request-promise');
const config = require('../config/config.json');

const SORT_ORDER = {
    POPULARITY: 'popularity',
    DATE: 'date',
    RELEVANCE: 'relevance'
};

const MAX_RESULT = 2;

const getEventsByLocation = (location) => {
    const options = {
        method: 'get',
        url: 'http://api.eventful.com/json/events/search',
        qs: {
            app_key: config.eventful.apiKey,
            sort_order: SORT_ORDER.POPULARITY,
            location: location
        },
        json: true
    };

    return request(options)
        .then(data => (data.events && data.events.event) || [])
        .then(events => {
            if (events.length === 0) {
                return [];
            }

            const relevantEventInfo = [];
            events.filter(event => event.performers)
                .slice(0, MAX_RESULT)
                .forEach(event => {
                const artist = event.performers.performer.name || event.performers.performer[0].name;
                const venue = event.venue_name;
                const title = event.title;
                const date = event.start_time;
                const url = event.url;
                relevantEventInfo.push({
                    artist,
                    title,
                    venue,
                    date,
                    url
                })
            });
            return relevantEventInfo;
        })
};

module.exports = {
    getEventsByLocation
};
