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
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verify(token,phone,function(validToken){
      if(validToken){
        _data.read('users', phone, function(error, data) {
          if (!error && data) {
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      }else{
        callback(403,{'Error':'Invalid token or missing header'});
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

      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verify(token,phone,function(validToken){
      if(validToken){
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
      }else{
        callback(403,{'Error':'Invalid token or missing header'});
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
  var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
  handlers._tokens.verify(token,phone,function(validToken){
    if(validToken){
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
    }else{
      callback(403,{'Error':'Invalid token or missing header'});
    }});
} else {
  callback(400, { Error: ' User a valid phone number' });
}
};

handlers.tokens = function(data, callback) {
  var allowedMethods = ['post', 'get', 'put', 'delete'];
  if (allowedMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._tokens= {};

handlers._tokens.post = function(data,callback){
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

    if(phone && password){
      _data.read('users',phone, function(error,userData){
        if(!error && userData){
          var hashedPassword = helpers.hash(password);
          if(hashedPassword == userData.hashedPassword){
            var tokenId = helpers.randomString(30);
            var expire = Date.now() + 1000*60*30;
            var tokenObject = {
              'tokenId' :tokenId,
              'phone': phone,
              'expire': expire
            };
            _data.create('tokens',tokenId,tokenObject, function(error){
              if(!error){
                callback(200, tokenObject);
              }else{
                callback(500,{'Error': 'Could not create the token please check the details and try again'});
              }
            });

          }else{
            callback(400,{'Error':'Provide a valid password and phone number'});
          }

        }else{
          callback(400,{'Error':'User does not exist'});
        }
      });

    }else{
      callback(400,{'Error': 'Missising required fields'});
    }
};
handlers._tokens.get = function(data,callback){
  var tokenId =
    typeof data.queryStringObject.tokenId == 'string' &&
    data.queryStringObject.tokenId.trim().length == 30
      ? data.queryStringObject.tokenId.trim()
      : false;
  if (tokenId) {
    _data.read('tokens', tokenId, function(error, tokenData) {
      if (!error && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404, {'Error': 'Token not found!!!'});
      }
    });
  } else {
    callback(400, { Error: ' Missing required fields' });
  }
};

handlers._tokens.put = function(data,callback){
  var tokenId =
  typeof data.payload.tokenId == 'string' &&
  data.payload.tokenId.trim().length == 30
    ? data.payload.tokenId.trim()
    : false;
  var extend = 
  typeof data.payload.extend == 'boolean' &&
  data.payload.extend == true
    ? true
    : false;
    if (tokenId && extend){
      _data.read('tokens',tokenId,function(error,tokenData){
        if(!error && tokenData){
          if(tokenData.expire > Date.now()){
            tokenData.expire =  Date.now() + 1000 * 60 * 30;
            _data.update('tokens',tokenId,tokenData,function(error){
              if(!error){
                callback(200,{'Message': 'The time was successfully updated'});
              }else{
                callback(500,{'Eror': 'Could not update the token'});
              }
            });
          }else{
            callback(400,{'Error': 'The token has expired, log in to continue'});
          }
        }else{
          callback(404,{'Error':'Token does not exist'})
        }
      });

    }else{
      callback(500,{'Error': 'Missing required field(s)'});
    }
};

handlers._tokens.delete = function(data,callback){
  var tokenId =
  typeof data.queryStringObject.tokenId == 'string' &&
  data.queryStringObject.tokenId.trim().length == 30
    ? data.queryStringObject.tokenId.trim()
    : false;
if (tokenId) {
  _data.read('tokens', tokenId, function(error, data) {
    if (!error && data) {
     _data.delete('tokens',tokenId,function(error){
       if(!error){
        callback(200,{'Mesage':'You have logged out'});
       }else{
        callback(400, { Error: ' There was a problem logging out' });
       }
     });
    } else {
      callback(400, { Error: ' Your session has expired login' });
    }
  });
} else {
  callback(400, { Error: ' Your are already logged out' });
}
};

handlers._tokens.verify = function(tokenId,phone,callback){
  _data.read('tokens',tokenId,function(error,tokenData){
    if(!error && tokenData){
      if(tokenData.phone == phone && tokenData.expire > Date.now()){
        callback(true);
      }else{
        callback(false);
      }
    }else{
      callback(false);
    }
  });
}

handlers.ping = function(data, callback) {
  callback(200, { Admin: 'Pinging' });
};

handlers.NotFound = function(data, callback) {
  callback(404, {'Error': 'Page not Found !!!'});
};

module.exports = handlers;
