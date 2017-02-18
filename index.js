let express = require("express"),
  bodyParser = require("body-parser"),
  alexa = require("./alexa"),
  app = express();

const workouts = [
  'Push Ups',
  'Sit Ups',
  'Squats',
  'Power Jump',
  'Crunches',
  'Burpees'
];

app.use(bodyParser.json({
  verify: function getRawBody(req, res, buf) {
    req.rawBody = buf.toString()
  }
}))



app.get("/", (req, res) => {
  res.status(200).json({"status": 200})
})

app.get('/getWorkouts', (req, res) => {
  console.log("Got request");
  res.status(200).json({"status": 200})
})

app.post('/getWorkouts', (req, res) => {
  console.log("Got post request");
  res.status(200).json({"status": 200})
})

// app.post("/getWorkouts", requestVerifier, (req, res) => {
//   console.log(req);
//   if (req.body.request.type === 'LaunchRequest') {
//     res.json({
//       "version": "1.0",
//       "response": {
//         "shouldEndSession": true,
//         "outputSpeech": {
//           "type": "SSML",
//           "ssml": "<speak>Hmm <break time=\"1s\"/> Do you want to know today's workouts ?</speak>"
//         }
//       }
//     });
//   } else if(req.body.request.type === "SessionEndedRequest") {
//     console.log("Session ended", req.body.request.reason);
//   } else if(req.body.request.type === "IntentRequest") {
//     res.json({
//       "version": "1.0",
//       "response": {
//         "shouldEndSession": true,
//         "outputSpeech": {
//           "type": "SSML",
//           "ssml": "<speak>Let me list down the workouts for today!</speak>"
//         }
//       }
//     })
//   }
// });



// function requestVerifier(req, res, next) {
//   alexaVerifier(
//     req.headers.signaturecertchainurl,
//     req.headers.signature,
//     req.rawBody,
//     function verificationCallback(err) {
//       if (err) {
//         res.status(401).json({message: 'Verification Failure', error: err})
//       } else {
//         next()
//       }
//     }
//   )
// }

module.exports = app;