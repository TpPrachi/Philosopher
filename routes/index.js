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

  app.use('/sample', sample);
  app.use('/trends', trends);
  app.use('/users', users);
};

module.exports = {
  configure : _configure
};
