'use strict';

const englishOutput = {
    'SKILL_NAME': 'Cuecloud',
    'WELCOME_MESSAGE': 'Welcome to cue cloud. For which location do you want concerts?',
    'HELP_MESSAGE': "You can start cue cloud by saying 'start cue cloud'",
    'HELP_REPROMPT': 'How can I help you?',
    'STOP_MESSAGE': 'See you!'
};

const germanOutput = {
    'SKILL_NAME': 'Cuecloud',
    'WELCOME_MESSAGE': 'Willkommen! Für welche Stadt möchtest du Konzertinfos?',
    'HELP_MESSAGE': "Sage einfach 'öffne konzerte'",
    'HELP_REPROMPT': 'Wie kann ich dir helfen?',
    'STOP_MESSAGE': 'Bis bald!'
};

const speechOutput = {
    'en-GB': {
        'translation': englishOutput
    },
    'en-US': {
        'translation': englishOutput
    },
    'de-DE': {
        'translation': germanOutput
    }
};

// for easier development we put the output directly onto the speechOutput object
Object.assign(speechOutput, germanOutput);

module.exports = speechOutput;
