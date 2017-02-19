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
    WORKOUTFIND: "_WORKOUTFINDERMODE",
    WORKOUT: "_WORKOUTMODE",
    WORKOUTSET: "_WORKOUTSETMODE",
    HELP: "_HELPMODE",
    
};


var newSessionHandlers = {
    "LaunchRequest": function() {
        this.handler.state = STATES.WORKOUTFIND;
        this.emitWithState("GetWorkouts", false);
    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = STATES.WORKOUTFIND;
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


var workoutGuessHandlers = Alexa.CreateStateHandler(STATES.WORKOUTFIND, {
    "GetWorkouts": function() {
        // const workoutList = constants.WORKOUTS;
        // let workoutListMessage = workoutList.map((_workout, index) => `${_workout}  `);
        // const speechOutput = constants.GET_WORKOUT_SELECTION_MESSAGE + workoutListMessage.join(' ');
        // const repromptText = speechOutput
        // global.meta.speechOutput = speechOutput;
        // global.meta.repromptText = repromptText

        this.handler.state = STATES.WORKOUT
        // this.emit(':askWithCard', speechOutput, repromptText);
        this.emit(':askWithCard', "Going to SelectWorkout");
    }
});

var workoutHandlers = Alexa.CreateStateHandler(STATES.WORKOUT, {
    "SelectWorkout": function() {
        this.handler.state = STATES.WORKOUTSET;
        this.emitWithState("")
        // let selection = this.event.request.intent.slots.workout.value;
        // console.log(selection)
        // const workoutList = constants.WORKOUTS;
        // let workout = _.find(workoutList, _o => similarity(_o, selection) > 0.5);
        // console.log("Selected workout - ", workout);
        // if(workout) {
        //     this.handler.state = STATES.WORKOUTSET
        //     global.meta.setCount = 3
        //     global.meta.workoutCount = 1
        //     console.log("Attribute - ", global.meta);
        //     console.log(this.handler.state);
        //     console.log("Emitting to StartWorkoutSet");
        //     this.emit("StartWorkoutSet", false);
        // } else {
            
        //     this.emit(":ask", "Din't match, please say the name of the workout again !")
        // }
    },
    "ContinueWorkout": function() {
        if(global.meta.workoutCount == 2) {
           this.emit(":tell", "You are done with your workouts")
        }
        let workout = workoutList[global.meta.workoutCount]
        global.meta.workoutCount += 1
    },
    // "AMAZON.RepeatIntent": function() {
    //     this.emit(":ask", global.meta.speechOutput, global.meta.repromptText);
    // },
    "AMAZON.HelpIntent": function() {
        this.handler.state = STATE.HELP;
        this.emitWithState("HelpUser", false);
    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = STATES.HELP;
        this.emitWithState("HelpUser", false);
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


var workoutSetHandlers = Alexa.CreateStateHandler(STATES.WORKOUTSET, {
    "StartWorkoutSet": function() {
        // TODO: Publish workout start intent here.
        if(global.meta["setCount"] > 0 & this) {
            global.meta.setCount -= 1
            this.emit(":ask", "Just say am done when youu finish the set.")
        }
    },
    "FinishSet": function() {
        if(global.meta["setCount"] == 0) {
            this.handler.state = STATES.WORKOUT
            this.emitWithState("SelectWorkout");
        } else {
            this.emitWithState("StartWorkoutSet");
        }
    }
});

exports.handler = (event, context) => {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(newSessionHandlers, workoutGuessHandlers, workoutHandlers, workoutSetHandlers);
    alexa.execute();
};