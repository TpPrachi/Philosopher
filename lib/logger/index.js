
/**
* @name lib/logger/index.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
* @help https://www.npmjs.com/package/winston
* @version 0.0.0
*/

// Example for logger system
// logger.info("127.0.0.1 - there's no place like home");
// logger.warn("127.0.0.1 - there's no place like home");
// logger.error("127.0.0.1 - there's no place like home");

(function(){
  'use strict'
  var winston = require('winston');

  // Return the last folder name in the path and the calling module's filename.
  var getLabel = function(filename) {
      var parts = filename.split('/');
      return parts[parts.length - 2] + '/' + parts.pop();
  };

  module.exports = function(filename) {

    // Logger implementation for whole application with save in file
    return new winston.Logger({
        transports: [
            new winston.transports.Console({
                colorize: true,
                label: getLabel(filename)
            }),
            new (winston.transports.File)({
              name: 'error-file',
              filename: './logs/filelog-error.log',
              level: 'error',
              colorize:true,
              maxsize:10000,
              maxFiles:5,
              label: getLabel(filename)
            })
        ]
    });
  };

  // Feture
  // The winston-mail is an email transport:
})();
