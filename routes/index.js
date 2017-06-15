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
  var follow = require('./follow');
  var users = require('./users');
  var philosophies = require('./philosophies');

  app.use('/sample', sample);
  app.use('/trends', trends);
  app.use('/users', users);
  app.use('/follow', follow);
  app.use('/philosophies', philosophies);
};

module.exports = {
  configure : _configure
};
