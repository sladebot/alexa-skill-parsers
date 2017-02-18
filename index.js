
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

app.post("/api/iot/device", (req, res) => {
  console.log("GOT IOT DATA", req.body);
  var data = req.body;
  // Store data to Postgres
  var deviceData = {
    name: data.name,
    is_active: data.is_active
  }

  res.status(200).json({"status": "OK"});
});

app.post("/api/iot/user", (req, res) => {
  console.log("GOT IOT DATA", req.body);
  var data = req.body;
  var userData = {
    exercise: data.exercise,
    rating: data.rating,
    improvements: data.improvements,
    device_id: data.device_id
  };

  res.status(200).json({"status": "OK"});
});

module.exports = app;