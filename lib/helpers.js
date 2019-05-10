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

module.exports = helpers;
