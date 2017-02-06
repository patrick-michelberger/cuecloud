'use strict';

const handleJsonResponse = (status, data, callback) => {
    const response = {
        statusCode: status,
        body: JSON.stringify(data)
    };
    callback(null, response);
};

const handleRedirectResponse = (url, callback) => {
    const response = {
        statusCode: 302,
        headers: {
            Location: url
        },
        body: ''
    };
    callback(null, response);
};

const handlePermanentRedirectResponse = (url, callback) => {
    const response = {
        statusCode: 301,
        headers: {
            Location: url
        },
        body: ''
    };
    callback(null, response);
};

const handleErrorResponse = (status, message, callback) => {
    const response = {
        statusCode: status,
        body: JSON.stringify({
            "message": message
        })
    };
    callback(null, response);
};

module.exports = {
    handleJsonResponse,
    handleRedirectResponse,
    handlePermanentRedirectResponse,
    handleErrorResponse
};
