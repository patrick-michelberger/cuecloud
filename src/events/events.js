'use strict';

const bandsInTown = require('../api/bands-in-town');
const lambda = require('../api/aws-lambda');

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
        bandsInTown.fetchEvents(location, page).then((events) => {
            lambda.handleJsonResponse(200, events, callback);
        }).catch((error) => {
            lambda.handleErrorResponse(400, error, callback);
        });
    }
};
