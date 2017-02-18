'use strict';
var _ = require("lodash");
var Alexa = require("alexa-sdk");
const APP_ID = "amzn1.ask.skill.8985b048-54ab-452c-bee1-b9a0bd93603d";

const constants = {
    WORKOUTS: [
        'Push Ups',
        'Sit Ups',
        'Squats',
        'Power Jump',
        'Crunches',
        'Burpees'
    ],
    SKILL_NAME: 'Workouts',
    GET_WORKOUT_MESSAGE: "Here are your workouts options: ",
    HELP_MESSAGE: 'You can say tell me workouts, or, you can say exit... What can I help you with?',
    HELP_REPROMPT: 'What can I help you with?',
    STOP_MESSAGE: 'Goodbye!',
    START_WORKOUT_MESSAGE: 'Lets start with: '
}

const handlers = {
    'LaunchRequest': function () {
        let welcomeSpeech = "Hello ! Do you want to get today's workouts ? Say Alexa ! get workouts !"
        this.emit(":tell", welcomeSpeech)
    },
    'GetNewWorkoutIntent': function () {
        this.emit('GetWorkout');
    },
    'IntentRequest': function() {
        this.emit(":tell", "What can I help you with ?")
    },
    'GetWorkouts': function () {
        const workoutList = constants.WORKOUTS;
        let workoutListMessage = workoutList.map((_workout, index) => {
            return `${index + 1}. ${_workout}`
        })
        console.log("message - ", workoutListMessage)

        const speechOutput = constants.GET_WORKOUT_MESSAGE + workoutListMessage.join(' ');
        console.log('Speech Output - ', speechOutput)
        this.emit(':tellWithCard', speechOutput);
    },
    'SelectWorkout': function(intent) {
        let selection = this.event.request.intent.slots.workout.value;
        const workoutList = constants.WORKOUTS;
        console.log(`Searching ${workoutList} for ${selection}`)
        let workout = _.find(workoutList, _o => {
            return  _o.toLowerCase() == selection.toLowerCase();
        });

        if(workout) {
            const speechOutput = constants.START_WORKOUT_MESSAGE + workout;
            this.emit(':tell', speechOutput);
        } else {
            this.emit("AMAZON.HelpIntent");
        }
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = constants.HELP_MESSAGE
        const reprompt = constants.HELP_MESSAGE
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', constants.STOP_MESSAGE);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', constants.STOP_MESSAGE);
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', constants.STOP_MESSAGE);
    },
};

exports.handler = (event, context) => {
    console.log("Event, ", event);
    console.log("Context, ", context);
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    // alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};