/* eslint linebreak-style: ['error', 'windows'] */
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
/* eslint no-use-before-define: 0 */

const express = require('express');
const request = require('request');
const _ = require('lodash');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const Logger = require('node-color-log');
const JokesService = require('./data/jokes');

const config = {
  FB_MESSAGE_URL: 'https://graph.facebook.com/v2.11/me/messages',
  PROFILE_TOKEN:
  '',
  PORT: process.env.PORT || 5000,
  VERIFY_TOKEN: 'verification-token',
};

const logger = new Logger();
const app = express();
const helloMessage = 'Hello Tang Capital!';

app
  .use(helmet())
  .use(bodyParser.urlencoded({ extended: false }))
  .use(bodyParser.json())
  .get('/', (req, res) => res.send(helloMessage))
  .get('/webhook/', (req, res) => {
    if (req.query['hub.verify_token'] === config.VERIFY_TOKEN) {
      res.send(req.query['hub.challenge']);
    } else {
      res.send('Invalid verify token');
    }
  })
  .listen(config.PORT, () => {
    logger.log(`Listening on ${config.PORT}`);
  });

// Facebook Webhook
app.post('/webhook', (req, res) => {
  const events = req.body.entry[0].messaging;
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (event.message && event.message.text) {
      sendJoke(event.sender.id, { text: JokesService[_.random(1, 3773)].body });
    }
  }
  res.sendStatus(200);
});


function sendJoke(recipientId, message) {
  request({
    url: 'https://graph.facebook.com/v2.11/me/messages',
    qs: { access_token: config.PROFILE_TOKEN },
    method: 'POST',
    json: {
      recipient: { id: recipientId },
      message,
    },
  }, (error, response, body) => {
    if (error) {
      logger.log('Error sending message: ', error);
    } else if (response.body.error) {
      logger.log('Error: ', response.body.error);
      logger.log('Error sending message: ', body);
    }
  });
}
