
/**
* @name routes/philosophies/philosophies.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
*
* @version 0.0.0
*/

(function() {
  'use strict'
  var express = require('express');
  var router = express.Router();
  var db = require('../../lib/db');
  var validate = require('../../lib/validator');
  var schema = require('./schema');
  var softSchema = require('./softSchema');
  var logger = require('../../lib/logger')(__filename);
  var _ = require('lodash');
  var query = require('../../lib/query');
  var projections = require("../../lib/projections/philosophies");
  var util = require('./util');
  var notify = require('../../lib/notification');

  // Create single api which return count of all 4 points - may be not needed
  // Create api for getting list of all users who like (all 4) philosophies with username,user profile pic display link, user id
  // How to manage multilevel commnets and there info to display users information

  /* GET API for ALL records from collection. */
  router.get('/', query.filter, function(req, res, next) {
    db['philosophies'].find(req.filter, req.options.select || projections || {}, req.options).toArray(function(err, philosophies) {
      if(err) {
        logger.log(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(philosophies);
    });
  });

  /* GET API for selected record from collection. */
  router.get('/:id', function(req, res, next) {
    db['philosophies'].find({_id: db.ObjectID(req.params.id)}).toArray(function(err, philosophy) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(philosophy);
    });
  });

  /* POST API for insert record in collection. */
  router.post('/', validate(schema) , function(req, res, next) {
    var post = req.body;
    req.body["CreatedDate"] = new Date();
    req.body["UpdatedDate"] = new Date();
    req.body["userId"] = req.body.UID;
    req.body["replyCount"] = 0;
    req.body['like'] = {
      count:0,
      info:[]
    };
    req.body['dislike'] = {
      count:0,
      info:[]
    };
    req.body['objections'] = {
      count:0,
      info:[]
    };

    // For handling poll question and answer in different collection
    if(req.body['philosophyType'] == 'poll') {
      req.body["pollCount"] = 0;
      req.body["pollAnsCount"] = {};
      _.forEach(Object.keys(req.body['pollQuestions']), function(key) {
        req.body["pollAnsCount"][key] = 0;
      });
    }

    db['philosophies'].insert(req.body, function(err, philosophy) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      // For finding trends in philosophy and insert into trens table as well as update count for trend.
      util.trendMappingOnPost(req.body.philosophy, philosophy.insertedIds[0]);

      res.status(201).send({"success":true, "message":philosophy.insertedIds});
    });
  });

  // PATCH for add poll answer into polls colection and update poll counter based on answer key and philosophyId procided in request params
  router.patch('/poll/:philosophyId/:answer', function(req, res, next) {
    // Get philosophy based on philosophyId if find than go further else return invalid philosophyId with status 501
    db['philosophies'].findOne({'_id': db.ObjectID(req.params.philosophyId)}, {pollAnsCount: 1}, function(err, philosophy){
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      if(_.isNull(philosophy)) {
        logger.error("Please provide valid philosophy id.");
        res.status(501).send({"success":false, "message":"Please provide valid philosophy id."});
      }

      // Here for check provided answer key is present or not. If not than return invalid answer key with 501 stauts code
      if(_.includes(Object.keys(philosophy ? philosophy.pollAnsCount : {}), req.params.answer)) {
        req.body["CreatedDate"] = new Date();
        req.body["UpdatedDate"] = new Date();
        req.body["userId"] = req.body.UID;
        req.body["philosophyId"] = db.ObjectID(req.params.philosophyId);
        req.body["pollAnswer"] = req.params.answer;

        // Here for mapping users and philosophy detail with poll mapped table
        db['polls'].insert(req.body, function(err, poll) {
          if(err) {
            logger.error(err);
            res.status(501).send({"success":false, "message":err});
          }
          // Here for update poll answer count as well as individual question answer count for later use
          db['philosophies'].findOneAndUpdate({_id: db.ObjectID(req.params.philosophyId)}, {$set: {'UpdatedDate': new Date()}, $inc: { 'pollCount': 1, ["pollAnsCount." + req.params.answer] : 1}});
          res.status(201).send({"success":true, "message":poll.insertedIds});
        });
      } else {
        if(!_.isNull(philosophy)) {
          logger.error("Please provide valid answer key.");
          res.status(501).send({"success":false, "message":"Please provide valid answer key."});
        }
      }
    });
  });

  /* PATCH API for update philosophy values. */
  router.patch('/:id', validate(softSchema) ,function(req, res, next) {
    req.body["UpdatedDate"] = new Date();

    // For finding trends in philosophy and insert into trens table as well as update count for trend.
    util.trendMappingOnPatch(req.body.philosophy, req.params.id);
    db['philosophies'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: req.body}, {returnOriginal: false}, function(err, philosophy) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).send({"success":true, "message":philosophy.value});
    });

  });

  // For remove philosophy as well as comment and reply associated with philosophy
  router.delete('/:id' ,function(req, res, next) {
    db['philosophies'].findOneAndDelete({_id : db.ObjectID(req.params.id)}, function(err, d){
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      util.removeReference(req.params.id);
      res.status(200).send({"success":true, "message":"philosophy deleted successfully."});
    });
  });

  router.patch('/:id/:operation/:flag' ,function(req, res, next) {
    var select = {
      'userId': 1
    };
    var notification = 0;
    if(!_.isUndefined(req.params.operation) && req.params.operation == 1 ){
      select['like'] = 1;
    } else if(!_.isUndefined(req.params.operation) && req.params.operation == 2){
      select['dislike'] = 1;
    } else if(!_.isUndefined(req.params.operation) && req.params.operation == 3){
      select['objections'] = 1;
    }

    db['philosophies'].findOne({_id: db.ObjectID(req.params.id)}, select, function(err, philosophy) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      if(_.isNull(philosophy)) {
        res.status(501).send({"success":false, "message": "Please provide valid data for perform operation."});
      } else {
        if (req.params.operation == 1) { // For Like
          if (req.params.flag == 'true') { // add into like info
            notification = 1;
            philosophy.like.count = philosophy.like.count + 1;
            philosophy.like.info.push({
              _id : req.body.UID,
              date : new Date()
            });
          } else if (req.params.flag == 'false') { // remove from like info
            var removeIds = _.remove(philosophy.like.info, {_id:req.body.UID});
            philosophy.like.count = philosophy.like.count - removeIds.length >= 0 ? philosophy.like.count - removeIds.length : 0;
          }
        } else if (req.params.operation == 2) { // For Dislike
          if (req.params.flag == 'true') {
            notification = 2;
            philosophy.dislike.count = philosophy.dislike.count + 1;
            philosophy.dislike.info.push({
              _id : req.body.UID,
              date : new Date()
            });
          } else if (req.params.flag == 'false')  { // remove from Dislike info
            var removeIds = _.remove(philosophy.dislike.info, {_id:req.body.UID});
            philosophy.dislike.count = philosophy.dislike.count - removeIds.length >= 0 ? philosophy.dislike.count - removeIds.length : 0;
          }
        } else if (req.params.operation == 3) { // For Objections
          if (req.params.flag == 'true') { // add into Objections info
            notification = 3;
            philosophy.objections.count = philosophy.objections.count + 1;
            philosophy.objections.info.push({
              _id : req.body.UID,
              date : new Date()
            });
          } else if (req.params.flag == 'false') { // remove from Objections info
            var removeIds = _.remove(philosophy.objections.info, {_id:req.body.UID});
            philosophy.objections.count = philosophy.objections.count - removeIds.length >= 0 ? philosophy.objections.count - removeIds.length : 0;
          }
        } else {
          logger.error('Operation does not match');
          res.status(501).send({"success":false, "message":'Operation does not match'});
        }

        philosophy["UpdatedDate"] = new Date();
        db['philosophies'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: philosophy}, {returnOriginal: false}, function(err, updatedPhilosophy) {
          if(err) {
            logger.error(err);
            res.status(501).send({"success":false, "message":err});
          }

          if(notification >= 1 && notification <= 3) {
            // Prepare object for add data in notification collection
            var prepareObject = {};
            prepareObject["notifyTo"] = philosophy.userId;
            prepareObject["notifyBy"] = req.body.UID;
            prepareObject["notifyType"] = notification == 1 ? "2" : (notification == 2 ? '3' : '4');
            prepareObject["philosophyId"] = philosophy._id;

            notify.addNotification(prepareObject);
          }

          res.status(200).send({"success":true, "message":"Success"});
        });
      }

    });
  });

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
        $lookup: {
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
    db['philosophies'].aggregate(aggregate, function(err, information) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(201).json(information);
    });
  });

  module.exports = router;

})();
