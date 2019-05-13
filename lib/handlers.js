const _data = require('./data');
const helpers = require('./helpers');

var handlers = {};

handlers.users = function(data, callback) {
  var allowedMethods = ['post', 'get', 'put', 'delete'];
  if (allowedMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._users = {};

handlers._users.post = function(data, callback) {
  var firstName =
    typeof data.payload.firstName == 'string' &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  var lastName =
    typeof data.payload.lastName == 'string' &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  var phone =
    typeof data.payload.phone == 'string' &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  var password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  var tosAgreement =
    typeof data.payload.tosAgreement == 'boolean' &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    _data.read('users', phone, function(error, data) {
      if (error) {
        var hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          var userObject = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            hashedPassword: hashedPassword,
            tosAgreement: true
          };

          _data.create('users', phone, userObject, function(error) {
            if (!error) {
              callback(200);
            } else {
              console.log(error);
              callback(500, { Error: 'Could not create a new user' });
            }
          });
        } else {
          callback(500, { Error: "Could not hash user's password" });
        }
      } else {
        callback(400, { Error: 'User with that number already exists' });
      }
    });
  } else {
    callback(400, { Error: ' Missing the required fields' });
  }
};

handlers._users.get = function(data, callback) {
  var phone =
    typeof data.queryStringObject.phone == 'string' &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    _data.read('users', phone, function(error, data) {
      if (!error && data) {
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: ' Missing a valid phone number' });
  }
};

handlers._users.put = function(data, callback) {
  var phone =
    typeof data.payload.phone == 'string' &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  var firstName =
    typeof data.payload.firstName == 'string' &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  var lastName =
    typeof data.payload.lastName == 'string' &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  var password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone) {
    if (firstName || lastName || password) {
      _data.read('users', phone, function(error, userData) {
        if (!error && userData) {
          if (firstName) {
            userData.firstName = firstName;
          }
          if (lastName) {
            userData.lastName = lastName;
          }
          if (password) {
            userData.hashedPassword = helpers.hash(password);
          }
          _data.update('users', phone, userData, function(error) {
            if (!error) {
              callback(200);
            } else {
              callback(500, { Error: 'The data could not be updated' });
            }
          });
        } else {
          callback(400, { Error: 'User does not exist' });
        }
      });
    } else {
      callback(400, { Error: ' Missing  fields to update' });
    }
  } else {
    callback(400, { Error: ' Missing the required field' });
  }
};

handlers._users.delete = function(data, callback) {

  var phone =
  typeof data.queryStringObject.phone == 'string' &&
  data.queryStringObject.phone.trim().length == 10
    ? data.queryStringObject.phone.trim()
    : false;
if (phone) {
  _data.read('users', phone, function(error, data) {
    if (!error && data) {
     _data.delete('users',phone,function(error){
       if(!error){
        callback(200);
       }else{
        callback(400, { Error: ' Could not delete the user' });

       }

     });
    
    } else {
      callback(400, { Error: ' Could not find the user' });
    }
  });
} else {
  callback(400, { Error: ' Missing a valid phone number' });
}

};

handlers.ping = function(data, callback) {
  callback(200, { Admin: 'Pinging' });
};

handlers.NotFound = function(data, callback) {
  callback(404);
};

module.exports = handlers;
