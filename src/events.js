'use strict'

const EventService = require('./services/event.service');

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
        EventService.fetchBandsintownEvents(location, page).then((events) => {
            handleResponse(200, events, callback);
        }).catch((error) => {
            handleError(400, error, callback);
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
};
