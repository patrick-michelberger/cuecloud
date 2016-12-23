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
        const city = this.event.request.intent.slots.city.value;
        songkick.getEvents(city)
            .then(events => {
                var artistCalls = [];
                events.forEach((event) => {
                    artistCalls.push(spotify.getArtistId(event.artist.name));
                });
                return Promise.all(artistCalls)
                    .then((artistIds) => {
                        for (var i = 0; i < events.length; i++) {
                            events[i].artist.spotifyId = artistIds[i];
                        }
                        return events;
                    });
            })
            .then(events => {
                var trackCalls = [];
                events.forEach((event) => {
                    trackCalls.push(spotify.getArtistTopTrackPreviewUrl(event.artist.spotifyId));
                });
                return Promise.all(trackCalls).then((previewUrls) => {
                    for (var i = 0; i < events.length; i++) {
                        events[i].artist.previewUrl = previewUrls[i];
                    }
                    return events;
                });
            })
            .then(events => {
                this.attributes['events'] = events;
                this.attributes['index'] = 0;

                const playBehavior = 'REPLACE_ALL';
                const expectedPreviousToken = null;
                const offsetInMilliseconds = 0;

                this.response.audioPlayerPlay(playBehavior, events[0].artist.previewUrl, this.attributes['index'], expectedPreviousToken, offsetInMilliseconds);
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
        var currentIndex = this.attributes['index'];

        if (currentIndex < numberOfEvents) {
            currentIndex = currentIndex + 1;
            this.attributes['index'] = currentIndex;
            this.response.audioPlayerPlay(playBehavior, events[currentIndex].artist.previewUrl, this.attributes['index'], this.attributes['index'] - 1, offsetInMilliseconds);
        }


        this.emit(':responseReady');

        /*
         * AudioPlayer.PlaybackNearlyFinished Directive received.
         * Using this opportunity to enqueue the next audio
         * Storing details in dynamoDB using attributes.
         * Enqueuing the next audio file.
         */

        //
        // if (this.attributes['enqueuedToken']) {
        //     /*
        //      * Since AudioPlayer.PlaybackNearlyFinished Directive are prone to be delivered multiple times during the
        //      * same audio being played.
        //      * If an audio file is already enqueued, exit without enqueuing again.
        //      */
        //     return this.context.succeed(true);
        // }
        //
        // var enqueueIndex = this.attributes['index'];
        // enqueueIndex += 1;
        // // Checking if  there are any items to be enqueued.
        // if (enqueueIndex === audioData.length) {
        //     if (this.attributes['loop']) {
        //         // Enqueueing the first item since looping is enabled.
        //         enqueueIndex = 0;
        //     } else {
        //         // Nothing to enqueue since reached end of the list and looping is disabled.
        //         return this.context.succeed(true);
        //     }
        // }
        // // Setting attributes to indicate item is enqueued.
        // this.attributes['enqueuedToken'] = String(this.attributes['playOrder'][enqueueIndex]);
        //
        // var enqueueToken = this.attributes['enqueuedToken'];
        // var playBehavior = 'ENQUEUE';
        // var podcast = audioData[this.attributes['playOrder'][enqueueIndex]];
        // var expectedPreviousToken = this.attributes['token'];
        // var offsetInMilliseconds = 0;
        //
        // this.response.audioPlayerPlay(playBehavior, podcast.url, enqueueToken, expectedPreviousToken, offsetInMilliseconds);
        // this.emit(':responseReady');
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
