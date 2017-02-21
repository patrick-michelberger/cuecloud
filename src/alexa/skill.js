'use strict';

const Alexa = require('alexa-sdk');
const songs = require('../songs/songs');
const speechOutput = require('./speech-output');
const events = require('../events/events');

// const Auth = require('./auth');

// TODO Put all paths into env script (also set path to ffmpeg into env vars)
// needed for aws lambda to find our binaries
process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

exports.handler = (event, context, callback) => {
    const alexa = Alexa.handler(event, context);
    alexa.appId = 'amzn1.ask.skill.baee0e61-2728-43f5-97d5-b8e3d43cbc63';
    //alexa.dynamoDBTableName = 'cuecloud';
    alexa.registerHandlers(handlers);
    alexa.resources = speechOutput;
    alexa.execute();
};

const handlers = {
    'LaunchRequest' () {
        this.emit(':ask', this.t('WELCOME_MESSAGE'), this.t('WELCOME_MESSAGE'));
    },
    'EventsInCityIntent' () {
        const city = this.event.request.intent.slots.city.value;
        if (!city) {
            this.emit(':ask', "Ich habe die Stadt nicht verstanden. Für weche Stadt möchtest du nochmal Konzertinfos?");
        } else {
            events.fetchEvents(city)
                .then(events => {
                    if (events.length < 1) {
                        this.emit(':tell', 'Ich habe leider keine Konzerte in ' + city + ' gefunden.');
                    } else {
                        let outputString = 'Ich habe ' + events.length + ' Konzerte in ' + city + ' gefunden. Von ';
                        events.forEach((event, index) => {
                            if (index !== events.length - 1) {
                                outputString += event.artist + ', ';
                            } else {
                                outputString += " und " + event.artist+ '. ';
                            }
                        });

                        if (events[0]) {
                            outputString += 'Jetzt kommt ' + events[0].artist +
                                ' in ' + events[0].venue +
                                '<break time="1s"/><audio src="' + events[0].topTrackPreviewUrl + '"></audio>' +
                                '. Weiter?';
                        }
                        this.emit(':ask', outputString, ' Weiter?');
                    }
                });
        }
    },
    'AMAZON.YesIntent'() {
        this.emit(':tell', 'Ja');
    },
    'AMAZON.NoIntent'() {
        this.emit(':tell', 'Nein');
    },
    'AMAZON.NextIntent'() {
        this.emit(':tell', 'Weiter');
    },
    'AMAZON.HelpIntent'(){
        this.emit(':ask', speechOutput.HELP_MESSAGE, speechOutput.HELP_REPROMPT);
    },
    'AMAZON.CancelIntent'(){
        this.attributes['index'] = 10;
        this.response.audioPlayerStop();
        this.emit(':tell', speechOutput.STOP_MESSAGE);
    },
    'AMAZON.StopIntent'(){
        this.attributes['index'] = 10;
        this.response.audioPlayerStop();
        this.emit(':responseReady');
    },
    'Unhandled'() {
        console.error('Error happened');
        this.emit(':tell', 'Ein Fehler ist aufgetreten');
    }
};
