
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
  var logger = require('../../lib/logger');
  var _ = require('lodash');
  var util = require('util');

  /* GET API for ALL records from collection. */
  router.post('/:philosophyId', function(req, res, next) {
    //At the time of posting reply of comment need reference of philosophyId
    req.body['philosophyId'] = db.ObjectID(req.params.philosophyId);
    //At the time of posting reply of comment need to add commentId
    //req.body['commentId'] = db.ObjectID(req.params.commentId);

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
    //req.body['commentCount'] = 0; //May be not needed

    db['reply'].insert(req.body, function(err, replies) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      // For increment counter of philosophy after add new reply
      util.replyUpdated(req.params.philosophyId, true);
      res.status(201).send({"success":true, "message":replies.insertedIds});
    });
  });

  /* GET API for ALL records from collection. */
  router.get('/:philosophyId', function(req, res) {
    db['reply'].find({philosophyId: db.ObjectID(req.params.philosophyId)}).toArray(function(err, reply) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(reply);
    });
  });

  // GET API for getting all users who reply on philosophyId
  router.get('/users/:replyId', function(req, res) {
    var select = {};
    select["users._id"] = 1;
    select["users.fullname"] = 1;
    select["users.profilePhoto"] = 1;

    // Build aggregate object for get users details based on operations with information
    var aggregate = [{
        "$match": { _id: db.ObjectID(req.params.replyId)}
      },{
        $lookup: {
           from: "usersmapped",
           localField: 'userId',
           foreignField: "userId",
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
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(201).json(information);
    });
  });

  // DELETE for remove reply from philosophy
  router.delete('/:id:/:philosophyId', function(req, res) {
    db['reply'].remove({_id: db.ObjectID(req.params.id)}).toArray(function(err, reply) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      // For decrement counter of philosophy after remove reply
      util.replyUpdated(req.params.philosophyId, false);
      res.status(200).send({"success":true, "message": "Deleted Successfully."});
    });
  });

  // PATCH for update count based on parameter passed in params for like, dislike or objection
  router.patch('/:id/:operation/:flag' ,function(req, res, next) {
    var select = {};
    if(!_.isUndefined(req.params.operation) && req.params.operation == 1 ){
      select['like'] = 1;
    } else if(!_.isUndefined(req.params.operation) && req.params.operation == 2){
      select['dislike'] = 1;
    } else if(!_.isUndefined(req.params.operation) && req.params.operation == 3){
      select['objections'] = 1;
    }

    db['reply'].findOne({_id: db.ObjectID(req.params.id)}, select, function(err, reply) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }

      if (req.params.operation == 1) { // For Like
        if (req.params.flag == 'true') {
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
        res.status(200).send({"success":true, "message": "Success"});
      });
    });
  });

  // GET for getting all users information who like, dislike or objection on reply
  router.get('/:id/:operation/' ,function(req, res, next) {
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
    select["users._id"] = 1;
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
        $project: select
      },{
        $sort: {fullname : 1}
        // $sort: 'fullname'
        //$skip - $limit (Not able to decide) - Prachi
      }
    ];
    //
    db['reply'].aggregate(aggregate, function(err, information) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(201).json(information);
    });
  });

  // New route for get with paging and sorting
  module.exports = router;

})();
