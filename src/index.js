'use strict';

const Alexa = require('alexa-sdk');
const spotify = require('./spotify');
const songkick = require('./songkick');

const speechOutput = {
    "SKILL_NAME": "Cuecloud",
    "WELCOME_MESSAGE": "Welcome to cue cloud. For which location do you want concerts?",
    "HELP_MESSAGE": "You can start cue cloud by saying 'start cue cloud'",
    "HELP_REPROMPT": "How can I help you?",
    "STOP_MESSAGE": "See you!"
};

exports.handler = (event, context, callback) => {
    const alexa = Alexa.handler(event, context);
    alexa.appId = 'amzn1.ask.skill.b6ec3527-15d1-406b-8a23-334f16dbe01a';
    alexa.dynamoDBTableName = 'cuecloud';
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const handlers = {
    'LaunchRequest' () {
        this.emit(':ask', speechOutput.WELCOME_MESSAGE);
    },
    'AskForEventsIntent' (events) {
        const city = alexaController.getIntent('city');
        eventController.getEvents(city)
            .then(events => {
                this.attributes['events'] = events;
                this.attributes['index'] = 0;

                const playBehavior = 'REPLACE_ALL';
                const expectedPreviousToken = null;
                const offsetInMilliseconds = 0;

                this.response.audioPlayerPlay(playBehavior, events[0].artist.previewUrl, this.attributes['index'], expectedPreviousToken, offsetInMilliseconds);

                let outputString = "I've found " + events.length + " concerts in " + city + " from ";

                events.forEach((event, index) => {
                    if (index !== events.length - 1) {
                        outputString += event.artist.name + " ";
                    } else {
                        outputString += "and " + event.artist.name + ". ";
                    }
                });

                outputString += "Now playing " + events[0].artist.name + " in " + events[0].venue.name;

                this.response.speak(outputString);
                this.emit(':responseReady');
            });
    },
    'PlaybackStarted': function() {
        console.log("PlaybackStarted");
    },
    'PlaybackNearlyFinished' () {
        const events = this.attributes.events;
        const playBehavior = 'ENQUEUE';
        const offsetInMilliseconds = 0;

        const numberOfEvents = events.length;
        let currentIndex = this.attributes['index'];

        if (currentIndex < numberOfEvents) {
            currentIndex = currentIndex + 1;
            this.attributes['index'] = currentIndex;
            this.response.audioPlayerPlay(playBehavior, events[currentIndex].artist.previewUrl, this.attributes['index'], this.attributes['index'] - 1, offsetInMilliseconds);
        }
        this.emit(':responseReady');
    },
    'SelectEventIntent' () {
        // TODO
    },
    'AMAZON.HelpIntent' () {
        this.emit(':ask', speechOutput.HELP_MESSAGE, speechOutput.HELP_REPROMPT);
    },
    'AMAZON.PauseIntent' () {
        this.emit(':tell', "Cuecloud stops");
    },
    'AMAZON.ResumeIntent' () {
        this.emit(':tell', "Cuecloud restart");
    },
    'AMAZON.CancelIntent' () {
        this.attributes['index'] = 10;
        this.response.audioPlayerStop();
        this.emit(':tell', speechOutput.STOP_MESSAGE);
    },
    'AMAZON.StopIntent' () {
        this.attributes['index'] = 10;
        this.response.audioPlayerStop();
        this.emit(':responseReady');
    }
};

const eventController = {
    'getEvents'(city) {
        return songkick.getEvents(city)
            .then(events => {
                // add spotify id for each artist
                const artistCalls = [];
                events.forEach((event) => {
                    artistCalls.push(spotify.getArtistId(event.artist.name));
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
                    trackCalls.push(spotify.getArtistTopTrackPreviewUrl(event.artist.spotifyId));
                });
                return Promise.all(trackCalls).then((previewUrls) => {
                    for (let i = 0; i < events.length; i++) {
                        events[i].artist.previewUrl = previewUrls[i];
                    }
                    return events;
                });
            })
    }
};

const alexaController = {
    'getIntent'(name) {
        return this.event.request.intent.slots.city.value;
    }
};
