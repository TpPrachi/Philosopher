/**
* @name lib/notification.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
*
* @version 0.0.1
*/

(function(){
  'use strict';
  var q= require('q');
  var db = require('./db');
  var logger = require('./logger')(__filename);
  var _ = require('lodash');

  // Here for add new notification as per object given from different routes
  // @notifyType : 1 for Follow, 2 for Like, 3 for Dislike, 4 for Objections, 5 for Reply, 6 for ReplyAll
  var _addNotification = function(notification) {
    // adding extra property to every notify object in array
    notification = _.reduce(notification, function(n, notify) {
      notify = notify || {};
      notify["CreatedDate"] = new Date();
      notify["UpdatedDate"] = new Date();
      notify["isRead"] = false;
      notify["isDeleted"] = false;

      n.push(notify);
      return n;
    }, []);

    logger.info("notification :: " + JSON.stringify(notification));

    db['notification'].insertMany(notification, function(err, d) {
      if(err) {
        logger.error("Error while adding notification :: " + err);
      }
      logger.info("Notification added with Id :: " + d.insertedIds);
    });
  }

  module.exports = {
    addNotification: _addNotification
  };
})();
