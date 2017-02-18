
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
}));

app.post('/api/alexa', (req, res) => {
  console.log("Echo request");
  const context = {
    fail: () => {
      console.log("FAILED");
      res.sendStatus(500);
    },
    succeed: data => {
      console.log("SUCCEED RESPONSE - ", data);
      res.send(data);
    }
  };
  req.body.request.locale = "en-GB";
  alexa.handler(req.body, context);
});

module.exports = app;