
/**
* @name routes/notification/notification.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
*
* @version 0.0.1
*/

(function() {
  'use strict'
  var express = require('express');
  var router = express.Router();
  var db = require('../../lib/db');
  var logger = require('../../lib/logger')(__filename);
  var _ = require('lodash');
  var query = require('../../lib/query');

  // GET api for getting notification based on filter data provided in query string
  // We also need to provide information about users as well as philosophy for display with notification
  router.get('/', query.filter, function(req, res, next) {
    db['notification'].find(req.filter, req.options.select || projections || {}, req.options).toArray(function(err, notifications) {
      if(err) {
        logger.log("Error while getting notifications :: " + err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(notifications);
    });
  });

  // For remove notification
  router.delete('/:id' ,function(req, res, next) {
    db['notification'].findOneAndDelete({_id : db.ObjectID(req.params.id)}, function(err, d){
      if(err) {
        logger.error("Error while removing notification :: " + err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).send({"success":true, "message":"Notification deleted successfully."});
    });
  });

  module.exports = router;

})();
