var _ = require('lodash');
var botkit = require('botkit');
var Q = require('q');

var Users = require('./users');

var MESSAGE_TYPES = 'direct_message direct_mention mention'.split(' ');

var Bot = {
  start: startBot
};

var setupBot = _.curry(function(controller, err, bot, payload) {
  if(err) {
    console.log(err);
    process.exit(1);
  }
  else {
    var users = Users(controller.storage);
    users.load(bot.api)
      .then(function() {
        setupHello(controller, users);
        setupCoffee(controller);
        setupSlackbotComebacks(controller, users);
      });
  }
}, 4);

function setupHello(controller, users) {
  var HELLOS = 'hello hi hey olá ola'.split(' ');
  controller.hears(HELLOS, MESSAGE_TYPES, sayHello);

  function sayHello(bot, message) {
    addReaction(bot, message, 'robot_face');

    users.find(message.user)
      .then(function(user) {
        if(user && user.name) {
          bot.reply(message, 'Hello ' + user.real_name.split(' ')[0] + '!');
        }
        else {
          bot.reply(message, 'Greetings!');
        }
      });
  }
}

function setupCoffee(controller) {
  var COFFEES = 'coffee café cafe'.split(' ');
  controller.hears(COFFEES, MESSAGE_TYPES, handleCoffee);

  function handleCoffee(bot, message) {
    addReaction(bot, message, 'coffee');
    bot.reply(message, 'Soon');
  }
}

function setupSlackbotComebacks(controller, users) {
  controller.hears('Também posso ir', 'ambient', respondNo);
  controller.hears('HÁ NATAS', 'ambient', respondNotForYou);

  function respondNo(bot, message) {
    users.isSlackbot(message.user, function() {
      bot.reply(message, 'No! :angry:');
    });
  }

  function respondNotForYou(bot, message) {
    users.isSlackbot(message.user, function() {
      bot.reply(message, 'Not for you :smirk:');
    });
  }
}

function startBot() {
  var botOptions = {
    debug: false,
    json_file_store: './bot_store'
  };
  var token = {
    token: process.env.BOT_TOKEN
  };
  var controller = botkit.slackbot(botOptions);
  controller.spawn(token)
    .startRTM(setupBot(controller));
}

function addReaction(bot, message, reaction) {
  var reactionOptions = {
    timestamp: message.ts,
    channel: message.channel,
    name: reaction,
  };
  bot.api.reactions.add(reactionOptions, function(err, res) {
    if(err) {
      bot.botkit.log('Failed to add emoji reaction :(', err);
    }
  });
}

module.exports = Bot;
