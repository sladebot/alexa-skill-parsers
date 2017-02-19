// var mqtt = require("mqtt");

// var client = mqtt.connect("mqtt://yainpykl:gRJj9gkdihrH@m13.cloudmqtt.com:11888");
var mqtt = require('mqtt'), url = require('url');
// Parse
var mqtt_url = url.parse(process.env.CLOUDMQTT_URL || 'mqtt://localhost:1883');
var auth = (mqtt_url.auth || ':').split(':');


var client = mqtt.createClient(mqtt_url.port, mqtt_url.hostname, {
  username: auth[0],
  password: auth[1]
});


client.on('connect', function() { // When connected

  // subscribe to a topic
  client.subscribe('data', function() {
    // when a message arrives, do something with it
    client.on('message', function(topic, message, packet) {
      console.log("Received '" + message + "' on '" + topic + "'");
    });
  });

  // publish a message to a topic
  setInterval(() => {
      client.publish('data', 'my message', function() {
      console.log("Message is published");
      client.end(); // Close the connection when published
    });
  }, 5000);
});
