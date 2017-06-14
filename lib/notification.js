/**
* @name lib/notification.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
*
* @version 0.0.0
*/

(function(){
  'use strict';
  var q= require('q');
  var db = require('./db');
  var logger = require('./logger');
  var _ = require('lodash');

  var _addNotification = function(notificationObject) {
    var deffered = q.defer();
    notificationObject = notificationObject || {};
    if(!_.isUndefined(notificationObject.notifyTo) && !_.isUndefined(notificationObject.notifyTo)){
      notificationObject["notifyDate"] = new Date();
      notificationObject["isRead"] = false;
      notificationObject["isDeleted"] = false;

      db['notification'].insert(notificationObject, function(err, d) {
        if(err) {
          logger.error(err);
          deffered.reject(err);
        }
        logger.info("JAY :: " + d.insertedIds);
        deffered.resolve(d.insertedIds[0]);
      });
    } else {
      deffered.reject("Something went wrong for notification.");
    }

    return deffered.promise;
  }

  module.exports = {
    addNotification: _addNotification
  };
})();
