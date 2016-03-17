var _ = require('lodash');
var botkit = require('botkit');
var Q = require('q');

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
    saveUsers(controller.storage, bot)
      .then(function() {
        setupHello(controller);
        setupCoffee(controller);
        setupSlackbotComebacks(controller);
      });
  }
}, 4);

function saveUsers(storage, bot) {
  return Q.promise(function(resolve, reject) {
    bot.api.users.list({}, function(err, response) {
      if(err) {
        reject(err);
      }
      else {
        Q.all(_.map(response.members, saveUser(storage)))
          .then(resolve)
          .catch(reject);
      }
    });
  });
}

var saveUser = _.curry(function(storage, user) {
  return Q.promise(function(resolve, reject) {
    storage.users.save(user, function(err) {
      if(err) {
        reject(err);
      }
      else {
        resolve(user);
      }
    });
  });
}, 2);

function findUser(controller, userId) {
  return Q.promise(function(resolve, reject) {
    controller.storage.users.get(message.user, function(err, user) {
      if(err) {
        reject(err);
      }
      else {
        resolve(user);
      }
    });
  });
}

function setupHello(controller) {
  var HELLOS = 'hello hi hey olá ola'.split(' ');
  controller.hears(HELLOS, MESSAGE_TYPES, sayHello);

  function sayHello(bot, message) {
    addReaction(bot, message, 'robot_face');

    findUser(controller, message.user)
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

function setupSlackbotComebacks(controller) {
  controller.hears('Também posso ir?', 'ambient', respondNo);
  controller.hears('NATAS? HÁ NATAS?', 'ambient', respondNotForYou);

  function respondNo(bot, message) {
    isFromSlackbot(controller, message, function() {
      bot.reply(message, 'No! :angry:');
    });
  }

  function respondNotForYou(bot, message) {
    isFromSlackbot(controller, message, function() {
      bot.reply(message, 'Not for you :smirk:');
    });
  }

  function isFromSlackbot(controller, message, callback) {
    findUser(controller, message.user)
      .then(function(user) {
        if(user.name.match(/slackbot/i)) {
          callback();
        }
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
