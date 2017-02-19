'use strict';
var _ = require("lodash");
var Alexa = require("alexa-sdk");
var similarity = require("similarity");

global.meta = {
    
};

const APP_ID = "amzn1.ask.skill.8985b048-54ab-452c-bee1-b9a0bd93603d";

const constants = {
    WORKOUTS: [
        'Push Ups',
        'Squats',
        'Jumping Jacks'
    ],
    SKILL_NAME: 'Workouts',
    GET_WORKOUT_SELECTION_MESSAGE: "Here are your workouts options: ",
    HELP_MESSAGE: 'You can say tell me workouts, or, you can say exit... What can I help you with?',
    HELP_REPROMPT: 'What can I help you with?',
    STOP_MESSAGE: 'Goodbye!',
    START_WORKOUT_MESSAGE: 'Lets start with: ',
    UNHANDLED_MESSAGE: "Say get my workouts to get a new list ?"
}

const STATES = {
    WORKOUT: "_WORKOUTMODE",
    HELP: "_HELPMODE",
    
};


var newSessionHandlers = {
    "LaunchRequest": function() {
        this.handler.state = STATES.WORKOUT;
        this.emitWithState("GetWorkouts", false);
    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = STATES.WORKOUT;
        this.emitWithState("GetWorkouts", false);
    },
    "AMAZON.HelpIntent": function() {
        this.handler.state = STATES.HELP;
        this.emitWithState("HelpUser", false);
    },
    "Unhandled": function() {
        var speechOutput = constants.UNHANDLED_MESSAGE;
        this.emit(":ask", speechOutput, speechOutput);
    }
}

var workoutHandlers = Alexa.CreateStateHandler(STATES.WORKOUT, {
    "GetWorkouts": function() {
        const workoutList = constants.WORKOUTS;
        let workoutListMessage = workoutList.map((_workout, index) => `${_workout} <break time=3s/> `);
        const speechOutput = constants.GET_WORKOUT_SELECTION_MESSAGE + workoutListMessage.join(' ');
        const repromptText = speechOutput
        global.meta.speechOutput = speechOutput;
        global.meta.repromptText = repromptText
        this.handler.state = STATES.WORKOUT
        this.emit(':askWithCard', speechOutput, repromptText);
    },
    "SelectWorkout": function() {
        let selection = this.event.request.intent.slots.workout.value;
        const workoutList = constants.WORKOUTS;
        let parsedWorkout = _.find(workoutList, _o => similarity(_o, selection) > 0.5);
        if(parsedWorkout) {
            this.handler.state = STATES.WORKOUT
            global.meta.setCount = 3
            global.meta.workoutsPending = _.remove(workoutList, (_workout) => _workout === parsedWorkout);
            this.emit("StartWorkoutSet");
        } else {
            this.emit(":ask", "Din't match, please say the name of the workout again !")
        }
    },
    "PerformRestWorkouts": function() {
        if(global.meta.workoutsPending.length > 0) {
            let selection = global.meta.workoutsPending.pop()
            global.meta.setCount = 3
            this.emit("StartWorkoutSet")
        } else {
            this.emit("FinishWorkout")
        }
    },
    "StartWorkoutSet": function() {
        // TODO: Publish workout start intent here.
        this.handler.state = STATES.WORKOUT
        if(global.meta.setCount > 0) {
            global.meta.setCount -= 1
            this.emit(":ask", "Just say I am done when you finish the set.")
        } else {
           console.log("Set finished & setCount - ", global.meta.setCount);
           this.emit("FinishSet");
        }
    },
    "ContinueWorkout": function() {
        if(global.meta.workoutCount == 2) {
           this.emit(":tell", "You are done with your workouts")
        }
        let workout = workoutList[global.meta.workoutCount]
        global.meta.workoutCount += 1
    },
    "FinishSet": function() {
        this.handler.state = STATES.WORKOUT
        if(global.meta.workoutsPending.length > 0) {
            this.emit("PerformRestWorkouts");
        } else {
            this.emit("FinishWorkout");
        }
    },
    "FinishWorkout": function() {
        this.handler.state = STATES.WORKOUT;
        this.emit(":tellWithCard", "Great you're done, check out the app I've sent stats. Cya next time !")
    },
    "AMAZON.RepeatIntent": function() {
        this.emit(":ask", global.meta.speechOutput, global.meta.repromptText);
    },
    "AMAZON.HelpIntent": function() {
        this.handler.state = STATE.HELP;
        this.emit("HelpUser", false);
    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = STATES.HELP;
        this.emit("HelpUser", false);
    },
    "AMAZON.StopIntent": function() {
        this.handler.state = STATES.HELP;
        var speechOutput = `Would you like to stop theworkout ?`
    },
    "Unhandled": function() {
        console.log(this.event.request.intent)
    },
    "SessionEndedRequest": function() {
        console.log("Session ended in workout finder state.")
    }
});

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(newSessionHandlers, workoutHandlers);
    alexa.execute();
};