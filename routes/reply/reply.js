
/**
* @name routes/comments/comments.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
*
* @version 0.0.0
*/
//25 July, 2017 - Prachi
(function(){
  'use strict'
  var express = require('express');
  var router = express.Router();
  var db = require('../../lib/db');
  var validate = require('../../lib/validator');
  var schema = require('./schema');
  var softSchema = require('./softSchema');
  var logger = require('../../lib/logger')(__filename);
  var _ = require('lodash');
  var util = require('./util');
  var notify = require('../../lib/notification');
  var query = require('../../lib/query');

  /* GET API for ALL records from collection. */
  router.post('/:philosophyId', function(req, res, next) {
    db['philosophies'].findOne({_id: db.ObjectID(req.params.philosophyId)}, {userId:1}, function(err, philosophy) {
      //At the time of posting reply of comment need reference of philosophyId
      req.body['philosophyId'] = db.ObjectID(req.params.philosophyId);

      req.body['userId'] = req.body.UID;
      req.body['createdDate'] = new Date();
      req.body['updatedDate'] = new Date();
      req.body['like'] = {
        count:0,
        info:[],
      };
      req.body['dislike'] = {
        count:0,
        info:[],
      };
      req.body['objections'] = {
        count:0,
        info:[],
      };

      db['reply'].insert(req.body, function(err, replies) {
        if(err) {
          logger.error("Error while insert reply :: " + err);
          res.status(501).send({"success":false, "message":err});
        }
        // Here for updating reply counter in philosophy
        util.updateReplyCount(req.params.philosophyId, true);

        // Prepare object for add information to notification collection
        if(req.body.replyType && req.body.replyType == 'reply') { // Add notification for reply
          var prepareObject = {};
          prepareObject["notifyTo"] = philosophy.userId;
          prepareObject["notifyBy"] = req.body.UID;
          prepareObject["notifyType"] = "5";
          prepareObject["philosophyId"] = philosophy._id;
          prepareObject["replyId"] = replies.insertedIds[0];

          notify.addNotification([prepareObject]);
        } else if(req.body.replyType && req.body.replyType == 'replyAll') {  // Add notification for replyAll
          if(req.body.notifyUsers && _.size(req.body.notifyUsers) > 0) {
            notify.addNotification(_.reduce(req.body.notifyUsers, function(n, users) {
              n.push({
                'notifyTo':db.ObjectID(users.id),
                'notifyBy':req.body.UID,
                'notifyType':'6',
                'philosophyId':philosophy._id,
                'replyId':replies.insertedIds[0]
              });
              return n;
            }, []));
          }
        }
        // Code for return actual updated count of reply on philosophy
        db['philosophies'].findOne({_id: db.ObjectID(req.params.philosophyId)}, {'replyCount':1}, function(err, updatedPhilosophy){
          if(err) {
            logger.error(err);
            res.status(200).json({"success":true, "data":"Success"});
          }
          res.status(200).json({"success":true, "data":updatedPhilosophy});
        });
      });
    });
  });

  /* GET API for ALL records from collection. */
  router.get('/:philosophyId', function(req, res) {
    db['reply'].find({philosophyId: db.ObjectID(req.params.philosophyId)}).toArray(function(err, reply) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json({"success":true, "data":reply});
    });
  });

  // GET API for getting all users who reply on philosophyId. We are used this in reply all functionality
  router.get('/users/:replyId', function(req, res) {
    var select = {};
    select["users._id"] = 1;
    select["users.fullname"] = 1;
    select["users.profilePhoto"] = 1;

    // Build aggregate object for get users details based on operations with users information
    var aggregate = [{
        "$match": { _id: db.ObjectID(req.params.replyId)}
      },{
        $lookup: {
           from: "usersmapped",
           foreignField: "userId",
           localField: 'userId',
           as: "users"
        }
      },{
        $project: select
      },{
        $sort: {"users.fullname" : 1}
        // $sort: 'fullname'
        //$skip - $limit (Not able to decide) - Prachi
      }
    ];
    //
    db['reply'].aggregate(aggregate, function(err, information) {
      if(err) {
        logger.error("Error while getting users data of philosophy :: " + err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(201).json({"success":true, "data":information});
    });
  });

  // DELETE for remove reply from philosophy
  router.delete('/:id:/:philosophyId', function(req, res) {
    db['reply'].remove({_id: db.ObjectID(req.params.id)}).toArray(function(err, reply) {
      if(err) {
        logger.error("Error while deleting reply :: " + err);
        res.status(501).send({"success":false, "message":err});
      }
      // For decrement counter of philosophy reply after remove reply
      util.updateReplyCount(req.params.philosophyId, false);
      res.status(200).send({"success":true, "message": "Deleted Successfully."});
    });
  });

  // PATCH for update count based on parameter passed in params for like, dislike or objection
  router.patch('/:id/:operation/:flag' ,function(req, res, next) {
    var select = {
      'userId': 1,
      'philosophyId':1
    };
    var selectAfterUpdate = {}; // var used for return updated count for patch api
    var notification = 0;

    if(!_.isUndefined(req.params.operation) && req.params.operation == 1 ){
      select['like'] = 1;
      selectAfterUpdate['like.count'] = 1;
    } else if(!_.isUndefined(req.params.operation) && req.params.operation == 2){
      select['dislike'] = 1;
      selectAfterUpdate['dislike.count'] = 1;
    } else if(!_.isUndefined(req.params.operation) && req.params.operation == 3){
      select['objections'] = 1;
      selectAfterUpdate['objections.count'] = 1;
    }

    db['reply'].findOne({_id: db.ObjectID(req.params.id)}, select, function(err, reply) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }

      if (req.params.operation == 1) { // For Like
        if (req.params.flag == 'true') {
          notification = 1;
          reply.like.count = reply.like.count + 1;
          reply.like.info.push({
            _id : req.body.UID,
            date : new Date()
          });
        } else {
          var removeIds = _.remove(reply.like.info, {_id:req.body.UID});
          reply.like.count = reply.like.count - removeIds.length >= 0 ? reply.like.count - removeIds.length : 0;
        }
      } else if (req.params.operation == 2) { // For Dislike
        if (req.params.flag == 'true') {
          notification = 2;
          reply.dislike.count = reply.dislike.count + 1;
          reply.dislike.info.push({
            _id : req.body.UID,
            date : new Date()
          });
        } else {
          var removeIds = _.remove(reply.dislike.info, {_id:req.body.UID});
          reply.dislike.count = reply.dislike.count - removeIds.length >= 0 ? reply.dislike.count - removeIds.length : 0;
        }
      } else if (req.params.operation == 3) { // For Objections
        if (req.params.flag == 'true') {
          notification = 3;
          reply.objections.count = reply.objections.count + 1;
          reply.objections.info.push({
            _id : req.body.UID,
            date : new Date()
          });
        } else {
          var removeIds = _.remove(reply.objections.info, {_id:req.body.UID});
          reply.objections.count = reply.objections.count - removeIds.length >= 0 ? reply.objections.count - removeIds.length : 0;
        }
      } else {
        logger.error('Operation does not match');
        res.status(501).send({"success":false, "message":'Operation does not match'});
      }

      db['reply'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: reply}, {returnOriginal: false}, function(err, updatedReply) {
        if(err) {
          logger.error(err);
          res.status(501).send({"success":false, "message":err});
        }

        // Code for add information to notification collection based on user action like,dislike or objection
        if(notification >= 1 && notification <= 3 && !_.isUndefined(reply)) {
          notify.addNotification([{
            'notifyTo': reply.userId,
            'notifyBy': req.body.UID,
            'notifyType': (notification == 1 ? "2" : (notification == 2 ? '3' : '4')),
            'philosophyId': reply.philosophyId,
            'replyId': db.ObjectID(req.params.id)
          }]);
        }

        // Code for return actual updated count of like, dislike or objecetions
        db['reply'].findOne({_id: db.ObjectID(req.params.id)}, selectAfterUpdate, function(err, updatedReply){
          if(err) {
            logger.error(err);
            res.status(200).send({"success":true, "message": "Success"});
          }
          res.status(200).json({"success":true, "data":updatedReply});
        });
      });
    });
  });

  // GET for getting all users information who like, dislike or objection on reply
  router.get('/:id/:operation/', query.filter, function(req, res, next) {
    var select = {};
    // build select cluase for selected fields to send to response
    if(!_.isUndefined(req.params.operation) && req.params.operation == 1 ){
      select['like'] = 1;
    } else if(!_.isUndefined(req.params.operation) && req.params.operation == 2){
      select['dislike'] = 1;
    } else if(!_.isUndefined(req.params.operation) && req.params.operation == 3){
      select['objections'] = 1;
    } else {
      res.status(501).send({"success":false, "message": "Please provide valid data for information."});
    }
    select["users.userId"] = 1;
    select["users.fullname"] = 1;

    // Build aggregate object for get users details based on operations with information
    var aggregate = [{
        "$match": { _id: db.ObjectID(req.params.id)}
      },{
        "$unwind": (req.params.operation == 1 ? "$like.info" : (req.params.operation == 2 ? "$dislike.info" : (req.params.operation == 3 ? "$objections.info" : "")))
      },{
        $lookup:{
           from: "usersmapped",
           localField: (req.params.operation == 1 ? "like.info._id" : (req.params.operation == 2 ? "dislike.info._id" : (req.params.operation == 3 ? "objections.info._id" : ""))),
           foreignField: "userId",
           as: "users"
        }
      },{
        $skip:req.options['skip']
      },{
        $limit:req.options['limit']
      },{
        $project: select
      }
    ];
    //
    db['reply'].aggregate(aggregate, function(err, information) {
      if(err) {
        logger.error("Error while returning reply information :: " + err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(201).json({"success":true, "data":information});
    });
  });

  // New route for get with paging and sorting
  module.exports = router;

})();
