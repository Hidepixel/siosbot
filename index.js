var dotenv = require('dotenv');
var fs = require('fs');

var bot = require('./bot');

fs.exists('.env', function(exists) {
  if(exists) {
    dotenv.load();
    if(process.env.BOT_TOKEN) {
      bot.start();
    }
    else {
      console.log('Bot token is missing');
      process.exit(1);
    }
  }
  else {
    console.log('Could not find .env file');
    process.exit(1);
  }
});
