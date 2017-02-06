'use strict';

const Alexa = require('alexa-sdk');
const EventService = require('../events/events');
const TicketService = require('../events/ticket');
const SongKick = require('../api/songkick');
const songs = require('../songs/songs');
const speechOutput = require('./speech-output');
// const Auth = require('./auth');

exports.handler = (event, context, callback) => {
    const alexa = Alexa.handler(event, context);
    alexa.appId = 'amzn1.ask.skill.bd0d35ab-32a3-44d0-908b-c435639b447b';
    //alexa.dynamoDBTableName = 'cuecloud';
    alexa.registerHandlers(handlers);
    alexa.resources = speechOutput;
    alexa.execute();
};

const handlers = {
    'LaunchRequest' () {
        this.emit(':tell', this.t('WELCOME_MESSAGE'));
    },
    'AskForEventsIntent' () {
        const city = 'munich'; // this.event.request.intent.slots.city.value;
        const genre = 'electronic'; // this.event.request.intent.slots.genre.value || "electronic";

        if (!city) {
            this.emit(':tell', "Sorry, I haven't found any " + genre + " events in this city. Try another one.");
        } else {
            SongKick.getEvents(city)
                .then(events => {
                    console.log('1');
                    const previewTrackCalls = [];
                    events.forEach((event) => {
                        previewTrackCalls.push(songs.getPreviewTrackUrl(event.artist.name));
                    });
                    return Promise.all(previewTrackCalls)
                        .then((previewTracks) => {
                            console.log('1.1', previewTracks);
                            for (let i = 0; i < events.length; i++) {
                                events[i].artist.previewUrl = previewTracks[i];
                            }
                            return events;
                        });
                })
                .then(events => {
                    console.log('2');
                    if (events.length < 1) {
                        this.emit(':tell', "Sorry, I haven't found any " + genre + " events in " + city + " Try another one.");
                    } else {
                        let outputString = "I've found " + events.length + " " + genre + " concerts in " + city + '<break time="1s"/>. from ';
                        events.forEach((event, index) => {
                            if (index !== events.length - 1) {
                                outputString += event.artist.name + ' <break time="0.5s"/>';
                            } else {
                                outputString += "and " + event.artist.name + ' <break time="0.5s"/>';
                            }
                        });

                        console.log('3');
                        if (events[0]) {
                            outputString += 'Now playing ' + events[0].artist.name + ' at ' + events[0].venue.name + '<break time="1s"/><audio src="' + events[0].artist.previewUrl + '"></audio>';
                        }
                        this.emit(':tell', outputString.replace("&", "and"));
                    }
                });
        }
    },
    'SendTicketIntent' (events) {
        const city = this.event.request.intent.slots.city.value;
        const genre = this.event.request.intent.slots.genre.value || "electronic";

        if (this.event.session.user.accessToken == undefined) {
            this.emit(':tellWithLinkAccountCard', 'To start using this skill, please use the companion app to authenticate on Amazon');
        } else if (!city) {
            this.emit(':tell', "Sorry, I haven't found any events in this city. Try another one.");
        } else {
            // Auth.decodeAccessToken(this.event.session.user.accessToken).then((user) => {
            //     return TicketService.sendEmail(user.email, user.displayName, city, genre)
            //         .then(() => {
            //             this.emit(':tell', "Hello, " + user.displayName + ". I've sent you a ticket link to " + user.email);
            //         });
            // }).catch((error) => {
            //     console.log("error: ", error);
            //     this.emit(':tell', "Sorry, I haven't found any events in this city. Try another one.");
            // });
        }
    },
    'PlaybackStarted': function() {
        console.log("PlaybackStarted");
    },
    'PlaybackNearlyFinished'() {
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
    'SelectEventIntent'(){
        // TODO
    },
    'AMAZON.HelpIntent'(){
        this.emit(':ask', speechOutput.HELP_MESSAGE, speechOutput.HELP_REPROMPT);
    },
    'AMAZON.PauseIntent'(){
        this.emit(':tell', "Cuecloud stops");
    },
    'AMAZON.ResumeIntent'(){
        this.emit(':tell', "Cuecloud restart");
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
    }
};
