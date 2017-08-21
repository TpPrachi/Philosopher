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
  var logger = require('./logger');
  var _ = require('lodash');

  // Here for add new notification as per object given from different routes
  // @notifyType : 1 for Follow, 2 for Like, 3 for Dislike, 4 for Objections, 5 for Reply, 6 for ReplyAll
  var _addNotification = function(notification) {
    notification = notification || {};
    notification["CreatedDate"] = new Date();
    notification["UpdatedDate"] = new Date();
    notification["isRead"] = false;
    notification["isDeleted"] = false;

    db['notification'].insert(notification, function(err, d) {
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
