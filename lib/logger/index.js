
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

  // Logger implementation for whole application with save in file
  winston.configure({
    transports: [
      new (winston.transports.Console)({colorize:true}),
      new (winston.transports.File)({
        name: 'error-file',
        filename: './logs/filelog-error.log',
        level: 'error',
        colorize:true,
        maxsize:10000,
        maxFiles:5
      })
      // new (winston.transports.File)({
      //    filename: './logs/logger.log',
      //    maxsize:10000,
      //    maxFiles:5
      //  })
    ]
  });

  module.exports = winston;

  // Feture
  // The winston-mail is an email transport:
})();
