const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

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
              delete userObject.hashedPassword;
              callback(200,userObject);
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
      _data.read('users', phone, function(error, userData) {
        if (!error && userData) {
         _data.delete('users',phone,function(error){
           if(!error){
             //delete users and their checks
            var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
            var checksToDelete = userChecks.length;
            if(checksToDelete > 0){
             var checksDeleted = 0;
             var deletionErrors = false;
             userChecks.forEach(function(checkId) {
               _data.delete('checks',checkId, function(error){
                 if(error){
                   deletionErrors = true;
                 }
                 checksDeleted++;
                 if(checksDeleted == checksToDelete){
                   if(!deletionErrors){
                     callback(200);
                   }
                   else{
                     callback(500,{'Error':'An error occurred trying to delete users checks'});
                   }
                 }
               });
               
             });}else{
              callback(200);
            }
            
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
handlers.checks = function(data, callback) {
  var allowedMethods = ['post', 'get', 'put', 'delete'];
  if (allowedMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._checks= {};

handlers._checks.post = function(data,callback){
  var protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol:false;
  var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim(): false;
  var method = typeof(data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method :false;
  var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes :false;
  var timeOutSeconds = typeof(data.payload.timeOutSeconds) == 'number' && data.payload.timeOutSeconds %1 === 0 && data.payload.timeOutSeconds >= 1 && data.payload.timeOutSeconds <= 5 ? data.payload.timeOutSeconds : false;
  
  if(protocol && url && method && successCodes && timeOutSeconds){
    var token = typeof(data.headers.token) == 'string' ? data.headers.token :false;
    _data.read('tokens',token,function(error,tokenData){
      if(!error && tokenData){
        var userPhone = tokenData.phone;
        _data.read('users', userPhone, function(error, userData){
          if(!error && userData){
            var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
            if(userChecks.length < config.maxCheckLimit){
              var checkId = helpers.randomString(30);
              var checkObject= {
                'id': checkId,
                'protocol': protocol,
                'userPhone': userPhone,
                'method':method,
                'url':url,
                'successCodes': successCodes,
                'timeOutSeconds':timeOutSeconds
              };
              _data.create('checks', checkId, checkObject, function(error){
                if(!error){
                  userData.checks= userChecks;
                  userData.checks.push(checkId);

                  _data.update('users',userPhone, userData, function(error){
                    if(!error){
                      callback(200, checkObject);
                    }else{
                      callback(500,{'Error':'Could not update the user check'})
                    }
                  });

                }else{
                  callback(400,{'Error':'Could not create the new check'});
                }
              });

            }else{
              callback(403,{'Error': 'You have reach your maximum number of checks with is '+config.maxCheckLimit+''});
            }

          }else{
            callback(403,{'Error': 'The user with that phone number does not exist'});
          }
        });
      }else{
        callback(403,{'Error': 'Missing token authentication'});
      }
    });
  }else{
    callback(400,{'Error': 'Missing required field(z)'});
  }
};

handlers._checks.get = function(data, callback) {
  var id =
    typeof data.queryStringObject.id == 'string' &&
    data.queryStringObject.id.trim().length == 30
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    _data.read('checks',id,function(error,checkData){
      if(!error && checkData){
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verify(token,checkData.userPhone,function(validToken){
          if(validToken){
            callback(200, checkData);
          }else{
            callback(403,{'Error':'Invalid token or missing header'});
          }
        });
      }else{
        callback(404);
      }
    });
  } else {
    callback(400, { Error: ' Missing a valid check Id' });
  }
};


handlers._checks.put = function(data, callback) {
  var id = typeof data.payload.id == 'string' && data.payload.id.trim().length == 30 ? data.payload.id.trim() : false;
  var protocol = typeof(data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol:false;
  var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim(): false;
  var method = typeof(data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method :false;
  var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes :false;
  var timeOutSeconds = typeof(data.payload.timeOutSeconds) == 'number' && data.payload.timeOutSeconds %1 === 0 && data.payload.timeOutSeconds >= 1 && data.payload.timeOutSeconds <= 5 ? data.payload.timeOutSeconds : false;
  if (id) {
    if (protocol || url || method || successCodes || timeOutSeconds) {
      _data.read('checks', id, function(error, checkData) {
        if (!error && checkData) {
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      handlers._tokens.verify(token,checkData.userPhone,function(validToken){
      if(validToken){
            if (protocol) {
              checkData.protocol = protocol;
            }
            if (url) {
              checkData.url = url;
            }
            if (method) {
              checkData.method = method;
            }
            if(successCodes){
              checkData.successCodes = successCodes;
            }
            if(timeOutSeconds){
              checkData.timeOutSeconds = timeOutSeconds;
            }
            _data.update('checks', id, checkData, function(error) {
              if (!error) {
                callback(200);
              } else {
                callback(500, { Error: 'The data could not be updated' });
              }
            });
          } else {
            callback(403,{'Error':'Invalid token or missing header'});
          }
        });
      }else{
        callback(400, { Error: 'Check does not exist' });
      }
    });
    } else {
      callback(400, { Error: ' Missing  fields to update' });
    }
  } else {
    callback(400, { Error: ' Missing the required field' });
  }
};


handlers._checks.delete = function(data, callback) {
  var id =
    typeof data.queryStringObject.id == 'string' &&
    data.queryStringObject.id.trim().length == 30
      ? data.queryStringObject.id.trim()
      : false;
if (id) {
  _data.read('checks',id,function(error,checkData){
    if(!error && checkData){
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      handlers._tokens.verify(token,checkData.userPhone,function(validToken){
    if(validToken){
      _data.delete('checks',id,function(error){
        if(!error){
          _data.read('users', checkData.userPhone, function(error, userData) {
            if (!error && userData) {
              var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
              checkPosition = userChecks.indexOf(id);
              if(checkPosition > -1){
                userChecks.splice(checkPosition,1);
                _data.update('users',checkData.userPhone,userData,function(error){
                  if(!error){
                   callback(200,{'Message':'Check Delete successfully'});
                  }else{
                   callback(500, { Error: ' Could not delete the check from the user object' });
                  }
                });
              }else{
                callback(500,{'Error':' Could not find the specified check'})
              }
            } else {
              callback(500, { Error: ' Could not find the user who create the check' });
            }
          });
        }else{
          callback(500,{'Error': 'Could not delete the specified check'})
        }
      });
    }else{
      callback(403,{'Error':'Invalid token or missing header'});
    }});

    }else{
      callback(400,{'Error': 'The ID provided does not exist'});
    }});
  
} else {
  callback(400, { Error: ' Use a valid check ID' });
}
};


handlers.ping = function(data, callback) {
  callback(200, { Admin: 'Pinging' });
};

handlers.NotFound = function(data, callback) {
  callback(404, {'Error': 'Page not Found !!!'});
};

module.exports = handlers;
