'use strict';
var _ = require("lodash");
var Alexa = require("alexa-sdk");
var similarity = require("similarity");
var net = require('net');
global.meta = {};


/**
 * 
 * TCP Stuff
 * 
 */
var HOST = '';

var sensorPiTCPServer = net.createServer(function(socket) {
	// socket.write('Echo server\r\n');
	socket.pipe(socket);
});
sensorPiTCPServer.listen(5800, '');
var sensorPiClient = new net.Socket()
sensorPiClient.connect(5800, HOST, () => {
    console.log("TCP Server connected  on 5800");
    sensorPiClient.write('Hello, server! Love, Client.');
});
sensorPiClient.on('data', (data) => {
    console.log(`Got data via tcp from sensor Pi- ${data}`);
})
sensorPiClient.on('close', function() {
	console.log('Sensor Pi Connection closed');
});

var cameraPiTCPServer = net.createServer(function(socket) {
	socket.write('Echo server\r\n');
	socket.pipe(socket);
});
cameraPiTCPServer.listen(5801, '');
var cameraPiTCPClient = new net.Socket()
cameraPiTCPClient.connect(5801, HOST, () => {
    console.log("TCP Server connected at 5801");
    cameraPiTCPClient.write('Hello, server! Love, Client.');
});
cameraPiTCPClient.on('data', (data) => {
    console.log(`Got data via tcp from sensor Pi- ${data}`);
})
cameraPiTCPClient.on('close', function() {
	console.log('Sensor Pi Connection closed');
});

const APP_ID = "amzn1.ask.skill.8985b048-54ab-452c-bee1-b9a0bd93603d";

const constants = {
    WORKOUTS: [
        'Push Ups',
        'Squats',
        'Jumping Jacks'
    ],
    SKILL_NAME: 'Workouts',
    GET_WORKOUT_SELECTION_MESSAGE: "Here are your workout options: ",
    HELP_MESSAGE: 'You can say tell me workouts, or, you can say exit... What can I help you with?',
    HELP_REPROMPT: 'What can I help you with?',
    STOP_MESSAGE: 'Goodbye!',
    START_WORKOUT_MESSAGE: 'Lets start with: ',
    UNHANDLED_MESSAGE: "Say get my workouts to get a new list ?"
}

const STATES = {
    WORKOUT: "_WORKOUTMODE",
    HELP: "_HELPMODE"
};


function sendDataToSensors(workout) {
    if(workout == "Push Ups") {
        console.log("Sending data to sensor ::::::::::")
        sensorPiClient.write("1");
    } else if(workout == "Squats") {
        cameraPiTCPClient.write("1");
    } else if(workout == "Jumping Jacks") {
        sensorPiClient.write("2");
        cameraPiTCPClient.write("2");
    }
}

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
        let workoutListMessage = workoutList.map((_workout, index) => `${_workout} <break time='0.5s'/> `);
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
            sendDataToSensors(parsedWorkout);
            global.meta.setCount = 3
            global.meta.workoutsPending = _.remove(workoutList, (_workout) => _workout === parsedWorkout);
            this.emitWithState("StartWorkoutSet");
            console.log("Called for first WORKOUT")
        } else {
            this.emit(":ask", "Din't match, please say the name of the workout again !")
        }
    },
    "ContinueWorkout": function() {
        this.handler.state = STATES.WORKOUT
        if(global.meta.workoutsPending.length > 0) {
            let selection = global.meta.workoutsPending.pop()
            global.meta.runningWorkout = selection;
            global.meta.setCount = 3
            sendDataToSensors(selection);
            this.emitWithState("StartWorkoutSet")
            console.log(`Called for ${global.meta.runningWorkout} WORKOUT`)
        } else {
            this.emitWithState("FinishWorkout")
        }
    },
    "StartWorkoutSet": function() {
        
        this.handler.state = STATES.WORKOUT
        if(global.meta.setCount > 0) {
            global.meta.setCount -= 1
            var runningWorkout = global.meta.runningWorkout;
            var speechOutput;
            if(runningWorkout) {
                var runningWorkoutSpeech = `${runningWorkout} is starting now. <break time="0.5s" />`;
                speechOutput = `${runningWorkoutSpeech} Just say I am done when you finish a set.`;
            }
            speechOutput = `Just say I am done when you finish a set.`;
            this.emit(":ask", speechOutput);
        } else {
           this.emitWithState("FinishSet");
        }
    },
    "FinishSet": function() {
        this.handler.state = STATES.WORKOUT
        if(global.meta.workoutsPending.length > 0) {
            this.emitWithState("ContinueWorkout");
        } else {
            this.emitWithState("FinishWorkout");
        }
    },
    "FinishWorkout": function() {
        this.handler.state = STATES.WORKOUT;
        this.emit(":tellWithCard", "Great you're done, check out the app I've sent stats. Cya next time !")
    },
    "AMAZON.RepeatIntent": function() {
        this.handler.state = STATES.WORKOUT
        this.emit(":ask", global.meta.speechOutput, global.meta.repromptText);
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