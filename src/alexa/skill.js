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
        const city = 'los angeles'; // this.event.request.intent.slots.city.value;
        const genre = 'electronic'; // this.event.request.intent.slots.genre.value || "electronic";
        if (!city) {
            this.emit(':ask', "Ich habe die Stadt nicht verstanden. Für weche Stadt möchtest du nochmal Konzertinfos?");
        } else {
            events.fetchEvents(city, genre)
                .then(events => {
                    const previewTrackCalls = [];

                    events.forEach((event) => {
                        previewTrackCalls.push(songs.getPreviewTrackUrl(event.artists[0].name));
                    });
                    return Promise.all(previewTrackCalls)
                        .then((previewTracks) => {
                            for (let i = 0; i < events.length; i++) {
                                events[i].artist = {};
                                events[i].artist.previewUrl = previewTracks[i];
                                events[i].artist.name = event.artists[0].name;
                            }
                            return events;
                        });
                })
                .then(events => {
                    if (events.length < 1) {
                        this.emit(':tell', 'Ich habe leider keine ' + genre + ' Konzerte in ' + city + ' gefunden.');
                    } else {
                        let outputString = 'Ich habe ' + events.length + ' ' + genre + ' Konzerte in ' + city + ' <break time="1s"/>. Von ';
                        events.forEach((event, index) => {
                            if (index !== events.length - 1) {
                                outputString += event.artist.name + ' <break time="0.5s"/>';
                            } else {
                                outputString += " und " + event.artist.name + ' <break time="0.5s"/>';
                            }
                        });

                        if (events[0]) {
                            outputString += 'Jetzt kommt ' + events[0].artist.name +
                                ' in ' + events[0].venue.name +
                                '<break time="1s"/><audio src="' + events[0].artist.previewUrl + '"></audio>' +
                                '. Weiter?';
                        }
                        this.emit(':ask', outputString.replace("&", "and"), 'Weiter?');
                    }
                });
        }
    },
    'AMAZON.YesIntent'() {

    },
    'AMAZON.NoIntent'() {

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
