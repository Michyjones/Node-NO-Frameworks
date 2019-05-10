const fs = require('fs');
const path = require('path');

const helpers = require('./helpers');

var lib = {};
lib.rootDir = path.join(__dirname, '/../.data/');

lib.create = function(dir, file, data, callback) {
  fs.open(lib.rootDir + dir + '/' + file + '.json', 'wx', function(
    error,
    fileDescriptor
  ) {
    if (!error && fileDescriptor) {
      var StrData = JSON.stringify(data);
      fs.writeFile(fileDescriptor, StrData, function(error) {
        if (!error) {
          fs.close(fileDescriptor, function(error) {
            if (!error) {
              callback(false);
            } else {
              callback('There was a problem closing the file');
            }
          });
        } else {
          callback('There was a problem writing on new file');
        }
      });
    } else {
      callback('Could not open the file, it may already exist');
    }
  });
};
lib.read = function(dir, file, callback) {
  fs.readFile(lib.rootDir + dir + '/' + file + '.json', 'utf-8', function(
    error,
    data
  ) {
    if (!error && data) {
      var parseData = helpers.parseJsonToObject(data);
      callback(false, parseData);
    } else {
      callback(error, data);
    }
  });
};

lib.update = function(dir, file, data, callback) {
  fs.open(lib.rootDir + dir + '/' + file + '.json', 'r+', function(
    error,
    fileDescriptor
  ) {
    if (!error && fileDescriptor) {
      var StrData = JSON.stringify(data);
      fs.ftruncate(fileDescriptor, function(error) {
        if (!error) {
          fs.writeFile(fileDescriptor, StrData, function(error) {
            if (!error) {
              fs.close(fileDescriptor, function(error) {
                if (!error) {
                  callback(false);
                } else {
                  callback('There was a problem closing the file');
                }
              });
            } else {
              callback('There was a problem writing to an existing file');
            }
          });
        } else {
          callback('There was a problem trancating on new file');
        }
      });
    } else {
      callback('Could not update the file, it may not exist');
    }
  });
};

lib.delete = function(dir, file, callback) {
  fs.unlink(lib.rootDir + dir + '/' + file + '.json', function(error) {
    if (!error) {
      callback(false);
    } else {
      callback('Error deleting the file');
    }
  });
};

module.exports = lib;
