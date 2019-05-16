const crypto = require('crypto');

const config = require('./config');

var helpers = {};

helpers.hash = function(str) {
  if (typeof str == 'string' && str.length > 0) {
    var hash = crypto
      .createHmac('sha256', config.hashSecret)
      .update(str)
      .digest('hex');
    return hash;
  }
};

helpers.parseJsonToObject = function(str) {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};
helpers.randomString = function(strLength){
    strLength = typeof(strLength) == 'number' && strLength >0? strLength : false;
    if(strLength){
        var characters = 'abcdefghiklmnopqrstuvwxyz0123456789';
        var string = '';
        for(i = 1; i<= strLength; i++){
            randamCharacter= characters.charAt(Math.floor(Math.random()* characters.length));
            string+=randamCharacter;
        }
        return string;

    }else{
        return false;
    }
};

module.exports = helpers;
