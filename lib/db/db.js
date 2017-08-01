'use strict'
/**
* @name db/db.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
*
* @version 0.0.1
*/
var logger = require('../logger');
var _ = require('lodash');
var skin = require('mongoskin');

var connectionString = process.env.DATABASE_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/' + (process.env.DB_NAME || 'phil');

console.log('Conn String :: ' + connectionString);
var db = skin.db(connectionString, {native_parser:true}); // Need to discuss use of native_parser in mongo?

// Used to create new objectID in from route
db.ObjectID = skin.ObjectID;  // Helpfull when we need to convert or create ObjectId for query direct to mongo

var _configure = function() {
  logger.info('here for bind collections to mongoskin');
  //logger.info(arguments);

  try {
    _.forEach(arguments, function configureEntities(entity) {
      logger.info('process ' + entity.collection + ' for binding with db');
      db.bind(entity.collection); // help in creating collection in mongodb and allow operation on it.

      // further code need to implement as per requirement for indexing
    });

    logger.info('Binding for all collections is completed successfully');
  } catch (err) {
    logger.error('Error while binding collection to the mongoskin');
    logger.error(err);
  }
  return db;
};

module.exports = {
  configure: _configure
};
