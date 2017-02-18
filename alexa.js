'use strict';

var Alexa = require("alexa-sdk");

var handlers = {
  'LaunchRequest': function () {
        this.emit('GetWorkout');
    },
    'GetNewWorkoutIntent': function () {
        this.emit('GetWorkout');
    },
    'GetWorkouts': function () {
        const workoutList = this.t('WORKOUTS');
        let workoutListMessage = []
        
        workoutList.forEach((_workout, index) => {
            workoutListMessage.push(`${index}. ${_workout}`);
        })
        
        // Create speech output
        const speechOutput = this.t('GET_WORKOUT_MESSAGE') + workoutListMessage.join('\n');
        this.emit(':tellWithCard', speechOutput);
    },
    'GetWorkout': function(intent) {
        const workoutList = this.t('WORKOUTS');
        let workout = null;
        
        workoutList.forEach((_workout, _index) => {
            if(workout == intent.slots.workout,value) {
                workout = e;
            }
        });
        const speechOutput = workout;
        this.emit(':tell', "O")
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    }
}



exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.registerHandlers(handlers);
  alexa.execute();
}