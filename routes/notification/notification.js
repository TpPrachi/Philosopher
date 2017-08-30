
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
  var projections = require("../../lib/projections/notification");
  var _ = require('lodash');
  var query = require('../../lib/query');

  // GET api for getting notification based on filter data provided in query string
  // We also need to provide information about users as well as philosophy for display with notification
  router.get('/', query.filter, function(req, res, next) {
    // Build aggregate object for get users details based on operations with information
    var aggregate = [{
        "$match": req.filter
      },{
        $lookup: {
           from: "usersmapped",
           localField: 'notifyBy',
           foreignField: "userId",
           as: "users"
        }
      },{
        $skip:req.options['skip']
      },{
        $limit:req.options['limit']
      },{
        $project:projections
      }
    ];

    db['notification'].aggregate(aggregate, function(err, information) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(201).json(information);
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