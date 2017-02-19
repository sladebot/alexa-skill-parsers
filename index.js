"use strict";


let express = require("express"),
  pg = require("pg"),
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

pg.defaults.ssl = true;
const pgConnectionString = "postgres://ojwptlyjtnekht:1410c04a2a76520d90e8a62bcfec63ef9d72f92786c8e3bf62f31db527f80dc0@ec2-184-72-249-88.compute-1.amazonaws.com:5432/d9ikn45jnknro5";
var client = new pg.Client(pgConnectionString);

client.connect();


var net = require('net');

var HOST = '127.0.0.1';
var PORT = 5800;

// Create a server instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection' event
// The sock object the callback function receives UNIQUE for each connection
net.createServer(function(sock) {
    
    // We have a connection - a socket object is assigned to the connection automatically
    console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
    
    // Add a 'data' event handler to this instance of socket
    sock.on('data', function(data) {
        
        console.log('DATA ' + sock.remoteAddress + ': ' + data);
        // Write the data back to the socket, the client will receive it as data from the server
        sock.write('You said "' + data + '"');
        
    });
    
    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
    });
    
}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.use(bodyParser.json());


app.get("/api/iot/devices", (req, res) => {
  let query = client.query("SELECT * from iot_devices LIMIT 10;");
  query.on("row", (row, result) => {
    result.addRow(row);
  });
  query.on("end", function(result) {
    res.status(200).json(result);
  });
});

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
  console.log("GOT IOT DATA", req.query);
  var data = req.body;
  // Store data to Postgres
  var deviceData = {
    user_id: data.user_id,
    device_id: +data.device_id,
    is_active: data.is_active
  }
  // var query = client.query(`INSERT INTO iot_devices (user_id, device_id, is_active) VALUES(${deviceData.user_id}, ${deviceData.device_id}, ${deviceData.is_active})`)

  var query = client.query(`UPDATE SET user_id=${user_id}, is_active=${is_active} WHERE device_id=${deviceData.device_id}`);
  query.on('row', (row, result) => {
    result.addRow(row)
  });

  query.on('end', (result) => {
    res.status(200).json({"status": "OK"});
  });
});

app.post("/api/iot/user", (req, res) => {
  console.log("GOT IOT DATA", req.query);
  var data = req.body;
  var userData = {
    exercise: data.exercise,
    rating: data.rating,
    improvements: data.improvements,
    device_id: data.device_id
  };
  var query = client.query(`INSERT INTO iot_data (exercise, rating, improvements, device_id) VALUES(${userData.exercise}, ${userData.rating}, ${userData.improvements}, ${userData.device_id})`)

  query.on('row', (row, result) => {
    result.addRow(row)
  });

  query.on('end', (result) => {
    res.status(200).json({"status": "OK"});
  });
});

module.exports = app;