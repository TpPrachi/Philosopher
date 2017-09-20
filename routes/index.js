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
  var upload = require('./upload');
  var logout = require('./logout');
  var notification = require('./notification');
  var reports = require('./reports');
  var groups = require('./groups');
  var polls = require('./polls');

  app.use('/upload', upload);
  app.use('/sample', sample);
  app.use('/follow', follow);
  app.use('/trends', trends);
  app.use('/users', users);
  app.use('/philosophies', philosophies);
  app.use('/comments', comments);
  app.use('/reply', reply);
  app.use('/logout', logout);
  app.use('/notification', notification);
  app.use('/reports', reports);
  app.use('/groups', groups);
  app.use('/polls', polls);

};

module.exports = {
  configure : _configure
};
