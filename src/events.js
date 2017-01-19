'use strict'

/**
 *  Dependencies
 */

const request = require('request');
const config = require("./config/config.json");

/**
 *  Handlers
 */
module.exports.getEvents = function(event, context, callback) {
    context.callbackWaitsForEmptyEventLoop = false; //<---Important

    const location = event.queryStringParameters.location;

    if (!location) {
        handleError(422, "Missing location query parameter.", callback);
    } else {
        const page = event.queryStringParameters.page || 0;
        const url = 'https://app.ticketmaster.com/discovery/v2/events.json?apikey=' + config.ticketmaster.apiKey + '&city=' + location + '&classificationName=Music' + '&page=' + page;

        var options = {
            method: 'get',
            url: url
        }
        request(options, function(error, res, body) {
            if (error) {
                handleError(400, error, callback);
            } else {
                body = JSON.parse(body);
                const page = body.page;
                let events = [];

                if (body._embedded) {
                    events = body._embedded.events ||  [];
                }

                const result = {
                    page: page,
                    events: events
                };
                handleResponse(200, result, callback);
            }
        });
    }
};

/**
 *  Helpers
 */
const handleResponse = (status, data, callback) => {
    const response = {
        statusCode: status,
        body: JSON.stringify(data)
    };
    callback(null, response);
};

const handleError = (status, message, callback) => {
    const response = {
        statusCode: status,
        body: JSON.stringify({
            "message": message
        })
    };
    callback(null, response);
};;
