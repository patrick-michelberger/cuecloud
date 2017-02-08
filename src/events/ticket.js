'use strict';

const request = require('request-promise');
const config = require("../config/config.json");
const events = require('./events');

const sendEmail = (email, receiverName, city, genre) => {
    return events.fetchEvents(city, genre)
        .then((events) => {
            const url = 'https://jg0zd2nq1g.execute-api.eu-west-1.amazonaws.com/prod/emails';
            let message = "Hello " + receiverName + ",<br/>Here are your ticket links for <b>" + genre + " concerts</b> in <b>" + city + "</b>.<br/>";

            if (events.length > 0) {
                events.forEach((event, index) => {
                    message += "<p>";
                    message += "<b>" + event.title + ":</b><br/>";
                    if (event.formatted_datetime) {
                        message += "Date: " + event.formatted_datetime + "<br/>";
                    }
                    if (event.venue && event.venue.name) {
                        message += "Venue: " + event.venue.name + "<br/>";
                    }
                    if (event.ticket_type && event.ticket_status) {
                        message += event.ticket_type + ": " + event.ticket_status + "<br/>";
                    }
                    if (event.ticket_url) {
                        message += "<a href='" + event.ticket_url + "' target='_blank'>Buy Ticket</a>"
                    }
                    if (event.facebook_rsvp_url) {
                        message += "<br/><a href='" + event.facebook_rsvp_url + "' target='_blank'>RSVP Facebook</a>"
                    }
                    if (event.artist_spotify_preview_url) {
                        message += "<br/><a href='" + event.artist_spotify_preview_url + "' target='_blank'>Listen a Track</a>"
                    }
                    if (event.artist_spotify_id) {
                        message += "<br/><a href='http://open.spotify.com/artist/" + event.artist_spotify_id + "' target='_blank'>Artist's Spotify Profile</a>"
                    }

                    message += "</p>";
                });
            } else {
                message += "<p>Sorry I've found no event. Try another city.</p>"
            }

            message += "<p>";
            message += "Have fun! Alexa.";
            message += "</p>";

            let postData = {
                receiverEmail: email,
                message: message
            };

            const options = {
                method: 'post',
                body: postData,
                json: true,
                url: url
            };
            return request(options);
        });
};

module.exports = {
    sendEmail
};
