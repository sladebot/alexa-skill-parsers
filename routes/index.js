var express = require('express');
var router = express.Router();

/* GET home page. */

const workouts = [
  'Push Ups',
  'Sit Ups',
  'Squats',
  'Power Jump',
  'Crunches',
  'Burpees'
];

router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.get('/getWorkouts', function(req, res) {
  res.status(200).json({"status": "OK"});
});


module.exports = router;
