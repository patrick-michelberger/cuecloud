'use strict';

const Alexa = require('alexa-sdk');
const spotify = require('./spotify');
const EventService = require('./services/event.service');

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
        const city = this.event.request.intent.slots.city.value;

        if (!city) {
            this.emit(':tell', "Sorry, I haven't found any events in this city. Try another one.");
        } else {
            eventController.getEvents(city)
                .then(events => {
                    if (events.length < 1) {
                        this.emit(':tell', "Sorry, I haven't found any events in this city. Try another one.");
                    } else {
                        let outputString = "I've found " + events.length + " concerts in " + city + '<break time="1s"/>. from ';
                        events.forEach((event, index) => {
                            if (index !== events.length - 1) {
                                outputString += event.artists[0].name + ' <break time="0.5s"/>';
                            } else {
                                outputString += "and " + event.artists[0].name + ' <break time="0.5s"/>';
                            }
                        });

                        if (events[0]) {
                            outputString += "Now playing " + events[0].artists[0].name + " at " + events[0].venue.name;
                        }
                        this.emit(':ask', outputString.replace("&", "and"));
                    }
                });
        }
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
    'getEvents' (city) {
        return EventService.fetchBandsintownEvents(city);
    }
};

const alexaController = {
    'getIntent' (name) {
        return this.event.request.intent.slots.city.value;
    }
};
