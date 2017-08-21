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

  var _addNotification = function(notification) {
    notification = notification || {};
    notification["CreatedDate"] = new Date();
    notification["UpdatedDate"] = new Date();
    notification["isRead"] = false;
    notification["isDeleted"] = false;

    // Here for add new notification as per object given from routes
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
