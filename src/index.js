'use strict';

const Alexa = require('alexa-sdk');
const Spotify = require('spotify-web-api-node');

const speechOutput = {
    "SKILL_NAME": "Cuecloud",
    "WELCOME_MESSAGE": "Willkommen bei Cuecloud",
    "HELP_MESSAGE": "Starte Cuecloud indem du 'starte cuecloud' sagst",
    "HELP_REPROMPT": "Wie kann ich dir helfen?",
    "STOP_MESSAGE": "Auf Wiedersehen!"
};

exports.handler = (event, context, callback) => {
    const alexa = Alexa.handler(event, context);
    alexa.appId = 'amzn1.ask.skill.b6ec3527-15d1-406b-8a23-334f16dbe01a';
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const handlers = {
    'LaunchRequest' () {
        this.emit(':ask', speechOutput.WELCOME_MESSAGE);
    },
    'StartFmFourIntent' () {
        this.emit(':tell', "Cuecloud startet nun");
    },
    'AMAZON.HelpIntent' () {
        this.emit(':ask', speechOutput.HELP_MESSAGE, speechOutput.HELP_REPROMPT);
    },
    'AMAZON.PauseIntent' () {
        this.emit(':tell', "Cuecloud pausieren");
    },
    'AMAZON.ResumeIntent' () {
        this.emit(':tell', "Cuecloud wieder starten");
    },
    'AMAZON.CancelIntent' () {
        this.emit(':tell', speechOutput.STOP_MESSAGE);
    },
    'AMAZON.StopIntent' () {
        this.emit(':tell', speechOutput.STOP_MESSAGE);
    }
};
