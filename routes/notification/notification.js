
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
  var aggregation = require("../../lib/aggregate");

  // GET api for getting notification based on filter data provided in query string
  // We also need to provide information about users as well as philosophy for display with notification tab
  router.get('/', query.filter, function(req, res, next) {
    // Build aggregate object for get users and philosophy details based on operations
    // var aggregate = [{
    //     "$match": req.filter
    //   },{
    //     $lookup: {
    //        from: "usersmapped",
    //        foreignField: "userId",
    //        localField: 'notifyBy',
    //        as: "users"
    //     }
    //   },{
    //     $lookup: {
    //        from: "philosophies",
    //        foreignField: "_id",
    //        localField: 'philosophyId',
    //        as: "philosophy"
    //     }
    //   },{
    //     $sort: {'UpdatedDate':-1}
    //   },{
    //     $skip:req.options['skip']
    //   },{
    //     $limit:req.options['limit']
    //   },{
    //     $project:projections
    //   }
    // ];

    req.filter['notifyTo'] = req.filter['notifyTo'] || db.ObjectID(req.body.userId);
    req['extraLookup'] = {
       from: "philosophies",
       foreignField: "_id",
       localField: 'philosophyId',
       as: "philosophy"
    };
    req['projections'] = projections;
    req['localField'] = 'notifyBy';
    req['notifyTo'] = {
      from: "usersmapped",
      foreignField: "userId",
      localField: 'notifyTo',
      as: "notifyToUsers" // Changes by JD
    };
    req['sort'] = {'UpdatedDate':-1};
    var aggregate = aggregation.getQuery(req);

    db['notification'].aggregate(aggregate, function(err, information) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(201).json({"success":true, "data":information});
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

  // For remove notification
  router.patch('/:id' ,function(req, res, next) {
    db['notification'].findOneAndUpdate({_id : db.ObjectID(req.params.id)}, {$set : req.body}, function(err, d){
      if(err) {
        logger.error("Error while removing notification :: " + err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).send({"success":true, "message":"Notification updated successfully."});
    });
  });

  // For getting count of all notifications using single api
  router.get('/count' ,function(req, res, next) {
    db['notification'].find({notifyTo : db.ObjectID(req.body.userId), isRead: false, isDeleted: false}, {notifyType:1}).toArray(function(err, notifications){
      if(err) {
        logger.error("Error while getting list of notifications :: " + err);
        res.status(501).send({"success":false, "message":err});
      }

      // Prepare object with count of each notification.
      var countStatus  = {};
      countStatus['follow'] = (_.remove(notifications, {notifyType: '1'}) || []).length;
      countStatus['like'] = (_.remove(notifications, {notifyType: '2'}) || []).length;
      countStatus['dislike'] = (_.remove(notifications, {notifyType: '3'}) || []).length;
      countStatus['objections'] = (_.remove(notifications, {notifyType: '4'}) || []).length;
      countStatus['reply'] = (_.remove(notifications, {notifyType: '5'}) || []).length;
      countStatus['replyAll'] = (_.remove(notifications, {notifyType: '6'}) || []).length;

      res.status(200).send({"success":true, "data":countStatus});
    });
  });

  module.exports = router;

})();
