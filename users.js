var _ = require('lodash');
var Q = require('q');

function Users(storage) {
  var users = {
    load: loadUsers,
    find: findUser,
    isSlackbot: isSlackbot
  };

  return users;

  function loadUsers(api) {
    return Q.promise(function(resolve, reject) {
      api.users.list({}, function(err, response) {
        if(err) {
          reject(err);
        }
        else {
          Q.all(_.map(response.members, _saveUser))
            .then(resolve)
            .catch(reject);
        }
      });
    });
  }

  function findUser(userId) {
    return Q.promise(function(resolve, reject) {
      storage.users.get(userId, function(err, user) {
        if(err) {
          reject(err);
        }
        else {
          resolve(user);
        }
      });
    });
  }

  function isSlackbot(userId, callback) {
    return users.find(userId)
      .then(function(user) {
        if(user.name.match(/slackbot/i)) {
          if(callback) {
            callback();
          }
          return true;
        }
        else {
          return false;
        }
      });
  }

  function _saveUser(user) {
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
  }
}

module.exports = Users;
