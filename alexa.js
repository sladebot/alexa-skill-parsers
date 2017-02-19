'use strict';
var _ = require("lodash");
var Alexa = require("alexa-sdk");
var similarity = require("similarity");

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
    HELP: "_HELPMODE"
};


var entryPointHandlers = {
    "LaunchRequest": function() {
        this.handler.state = STATES.WORKOUTFIND;
        this.emitWithState("GetWorkouts", true);
    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = STATES.WORKOUTFIND;
        this.emitWithState("GetWorkouts", true);
    },
    "AMAZON.HelpIntent": function() {
        this.handler.state = STATES.HELP;
        this.emitWithState("HelpUser", true);
    },
    "Unhandled": function() {
        var speechOutput = constants.UNHANDLED_MESSAGE;
        this.emit(":ask", speechOutput, speechOutput);
    }
}


var workoutGuessHandlers = Alexa.CreateStateHandler(STATES.WORKOUTFIND, {
    "GetWorkouts": function() {
        const workoutList = constants.WORKOUTS;
        let workoutListMessage = workoutList.map((_workout, index) => `${index + 1}. ${_workout}  `);
        const speechOutput = constants.GET_WORKOUT_SELECTION_MESSAGE + workoutListMessage.join(' ');
        const repromptText = speechOutput

        Object.assign(this.attribute, {
            "speechOutput": speechOutput,
            "repromptText": repromptText
        });

        this.handler.state = STATES.WORKOUT
        this.emit(':askWithCard', speechOutput, repromptText);
    }
});

var workoutHandlers = Alexa.CreateStateHandler(STATES.WORKOUT, {
    "SelectWorkout": function() {
        let selection = this.event.request.intent.slots.workout.value;
        const workoutList = constants.WORKOUTS;
        let workout = _.find(workoutList, _o => similarity(_o, selection) > 0.5);
        if(workout) {
            this.handler.state = STATES.WORKOUTSET
            Object.assign(this.attribute, {
                setCount: 3,
                workoutCount: 1
            })
            this.emitWithState("StartWorkoutSet", true);
        } else {
            
            this.emit(":ask", "Din't match, please say the name of the workout again !")
        }
    },
    "ContinueWorkout": function() {
        if(this.attribute.workoutCount == 2) {
           this.emit(":tell", "You are done with your workouts")
        }
        let workout = workoutList[this.attribute.workoutCount]
        Object.assign({
            workoutCount: this.attribute.workoutCount + 1
        });
    },
    "AMAZON.RepeatIntent": function() {
        this.emit(":ask", this.attributes["speechOutput"], this.attribute["repromptText"]);
    },
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
    "SessionEndedRequest": function() {
        console.log("Session ended in workout finder state.")
    }
});


var workoutSetHandlers = Alexa.CreateStateHandler(STATES.WORKOUTSET, {
    "StartWorkoutSet": function() {
        // TODO: Publish workout start intent here.
        if(this.attribute["setCount"] > 0 & this) {
            Object.assign(this.attribute, {
                setCount: this.attribute["setCount"] - 1
            })
            this.emit(":ask", "Just say am done when youu finish the set.")
        }
    },
    "FinishSet": function() {
        if(this.attribute["setCount"] == 0) {
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
    alexa.registerHandlers(entryPointHandlers);
    alexa.execute();
};