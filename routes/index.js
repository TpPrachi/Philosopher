'use strict'
/**
* @name routes/index.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
*
* @version 0.0.0
*/

var _configure = function(app) {
  var sample = require('./sample');
  var trends = require('./trends');
  var users = require('./users');
  var philosophies = require('./philosophies');
  var comments = require('./comments');
  var follow = require('./follow');
  var reply = require('./reply');

  app.use('/sample', sample);
  app.use('/follow', follow);
  app.use('/trends', trends);
  app.use('/users', users);
  app.use('/philosophies', philosophies);
  app.use('/comments', comments);
  app.use('/reply', reply);
};

module.exports = {
  configure : _configure
};
