
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
  var aggregation = require("../../lib/aggregate");

  /* GET API for ALL philosophies from collection. */
  router.get('/', query.filter, function(req, res, next) {
    db['block'].find({userId: db.ObjectID(req.body.userId)}).toArray(function(err, getBlockData) {
      db['follow'].find({followingUser:db.ObjectID(req.body.userId)}, {followedUser:1}).toArray(function(err, followed) {
        if(err) {
          // If we find any error still allow to execute query
          logger.error("Error while getting following information of users for filtering.");
          next();
        }
        // Prepare array of all users that logged in user followed.
        req.filter['$or'] = _.reduce(followed, function(c, f) {
          var data = _.find(getBlockData, {blockTo: f.followedUser});
          if (!data) {
            c.push({'userId': db.ObjectID(f.followedUser)});
          }
          return c;
        }, [{'userId': db.ObjectID(req.body.userId)}]);
        // Build aggregate object for get users details based on operations with information
        req['projections'] = projections;
        req['sort'] = {'CreatedDate':-1};
        var aggregate = aggregation.getQuery(req);

        db['philosophies'].aggregate(aggregate, function(err, information) {
          if(err) {
            logger.error(err);
            res.status(501).send({"success":false, "message":err});
          }
          information = _.reduce(information, function(d, philosophy) {
            // special case written for check current user is liked or dislike or objection on returned philosophies
            philosophy.isLike = _.findIndex(philosophy.like.info, { _id: req.body.userId }) != -1 ? true : false;
            philosophy.isDislike = _.findIndex(philosophy.dislike.info, { _id: req.body.userId }) != -1 ? true : false;
            philosophy.isObjections = _.findIndex(philosophy.objections.info, { _id: req.body.userId }) != -1 ? true : false;

            delete philosophy.like.info;
            delete philosophy.dislike.info;
            delete philosophy.objections.info;

            d.push(philosophy);
            return d;
          }, []);

          res.status(201).json({"success":true, "data":information});
        });
      });
    });
  });

  // Get users specific philosophies based on user id.
  router.get('/user/:user', query.filter, function(req, res, next) {
      req.filter['userId'] = db.ObjectID(req.params.user);
      // Build aggregate object for get users details based on operations with information
      req['projections'] = projections;
      req['sort'] = {'CreatedDate':-1};
      var aggregate = aggregation.getQuery(req);

      db['philosophies'].aggregate(aggregate, function(err, information) {
        logger.info("information :: " + information.length);
        if(err) {
          logger.error(err);
          res.status(501).send({"success":false, "message":err});
        }
        information = _.reduce(information, function(d, philosophy) {
          // special case written for check current user is liked or dislike or objection on returned philosophies
          philosophy.isLike = _.findIndex(philosophy.like.info, { _id: req.body.userId }) != -1 ? true : false;
          philosophy.isDislike = _.findIndex(philosophy.dislike.info, { _id: req.body.userId }) != -1 ? true : false;
          philosophy.isObjections = _.findIndex(philosophy.objections.info, { _id: req.body.userId }) != -1 ? true : false;

          delete philosophy.like.info;
          delete philosophy.dislike.info;
          delete philosophy.objections.info;

          d.push(philosophy);
          return d;
        }, []);

        res.status(201).json({"success":true, "data":information});
      });
  });

  /* GET API for selected record from collection. */
  router.get('/:id', query.filter, function(req, res, next) {
    req.filter = req.filter || {};
    req.filter['_id'] = db.ObjectID(req.params.id);
    var aggregate = aggregation.getQuery(req);
    db['philosophies'].aggregate(aggregate, function(err, philosophy) {
      db['block'].findOne({blockTo: db.ObjectID(philosophy[0].userId)}, function(err, getBlockData) {
        if(err) {
          logger.error(err);
          res.status(501).send({"success":false, "message":err});
        }
        if (!getBlockData) {
          philosophy = _.reduce(philosophy, function(d, p) {
            // special case written for check current user is liked or dislike or objection on returned philosophies
            p.isLike = _.findIndex(p.like.info, { _id: req.body.userId }) != -1 ? true : false;
            p.isDislike = _.findIndex(p.dislike.info, { _id: req.body.userId }) != -1 ? true : false;
            p.isObjections = _.findIndex(p.objections.info, { _id: req.body.userId }) != -1 ? true : false;
            delete p.like.info;
            delete p.dislike.info;
            delete p.objections.info;
            d.push(p);
            return d;
          }, []);
          res.status(200).json({"success":true, "data":philosophy});
        }else {
          res.status(501).send({"success":false, "message": "Blocked."});
        }
      });
    });
  });

  /* POST API for insert record in collection. */
  router.post('/', validate(schema) , function(req, res, next) {
    var post = req.body;
    req.body["CreatedDate"] = new Date();
    req.body["UpdatedDate"] = new Date();

    req.body["trends"] = [];
    req.body["images"] = req.body["images"] || [];
    req.body["video"] = req.body["video"] || [];
    req.body["recording"] = req.body["recording"] || [];
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
      req.body["pollLength"] = "";
      req.body["pollAnsCount"] = {};
      _.forEach(Object.keys(req.body['pollAnswer']), function(key) {
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
      if(_.isNull(philosophy)) { // if philosophy is not found based on params id then return with error
        logger.error("Please provide valid philosophy id.");
        res.status(501).send({"success":false, "message":"Please provide valid philosophy id."});
      }

      // Here for check provided answer key is present or not. If not than return invalid answer key with 501 stauts code
      if(_.includes(Object.keys(philosophy ? philosophy.pollAnsCount : {}), req.params.answer)) {
        req.body["CreatedDate"] = new Date();
        req.body["UpdatedDate"] = new Date();
        //req.body["userId"] = req.body.userId;
        req.body["philosophyId"] = db.ObjectID(req.params.philosophyId);
        req.body["pollAnswer"] = req.params.answer;

        // Here for mapping users and philosophy detail with poll collection
        db['polls'].insert(req.body, function(err, poll) {
          if(err) {
            logger.error(err);
            res.status(501).send({"success":false, "message":err});
          }
          // Here for update poll answer count as well as individual question answer count for later use
          db['philosophies'].findAndModify(
            {_id: db.ObjectID(req.params.philosophyId)}, {},
            {$set: {'UpdatedDate': new Date()}, $inc: { 'pollCount': 1, ["pollAnsCount." + req.params.answer] : 1}},
            {new : true}, function(err, philosophy) {
            if(err) {
              logger.error('Error while answer of poll question :: ' + err);
              res.status(501).send({"success":false, "message":err});
            }
            res.status(201).send({"success":true, "data":philosophy.value});
          });

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

    // For finding trends in philosophy and insert into trends collection as well as update count for trend.
    util.trendMappingOnPatch(req.body.philosophy, req.params.id);
    db['philosophies'].findAndModify(
      {_id: db.ObjectID(req.params.id)}, {}, {$set: req.body},
      {new: true}, function(err, philosophy) {
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
    var selectAfterUpdate = {}; // var used for return updated count for patch api
    var notification = 0; // var used for add requested information into notification collection, It hold type of operation affect on philosophy

    if(!_.isUndefined(req.params.operation) && req.params.operation == 1 ){
      select['like'] = 1;
      selectAfterUpdate['like.count'] = 1;
    } else if(!_.isUndefined(req.params.operation) && req.params.operation == 2){
      select['dislike'] = 1;
      selectAfterUpdate['dislike.count'] = 1;
    } else if(!_.isUndefined(req.params.operation) && req.params.operation == 3){
      select['objections'] = 1;
      selectAfterUpdate['objections.count'] = 1;
    } else {
      logger.error("Please provide valid information about operation.");
      res.status(501).send({"success":false, "message":"Please provide valid information about operation"});
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
              _id : req.body.userId,
              date : new Date()
            });
          } else if (req.params.flag == 'false') { // remove from like info
            var removeIds = _.remove(philosophy.like.info, {_id:req.body.userId});
            philosophy.like.count = philosophy.like.count - removeIds.length >= 0 ? philosophy.like.count - removeIds.length : 0;
          }
        } else if (req.params.operation == 2) { // For Dislike
          if (req.params.flag == 'true') {
            notification = 2;
            philosophy.dislike.count = philosophy.dislike.count + 1;
            philosophy.dislike.info.push({
              _id : req.body.userId,
              date : new Date()
            });
          } else if (req.params.flag == 'false')  { // remove from Dislike info
            var removeIds = _.remove(philosophy.dislike.info, {_id:req.body.userId});
            philosophy.dislike.count = philosophy.dislike.count - removeIds.length >= 0 ? philosophy.dislike.count - removeIds.length : 0;
          }
        } else if (req.params.operation == 3) { // For Objections
          if (req.params.flag == 'true') { // add into Objections info
            notification = 3;
            philosophy.objections.count = philosophy.objections.count + 1;
            philosophy.objections.info.push({
              _id : req.body.userId,
              date : new Date()
            });
          } else if (req.params.flag == 'false') { // remove from Objections info
            var removeIds = _.remove(philosophy.objections.info, {_id:req.body.userId});
            philosophy.objections.count = philosophy.objections.count - removeIds.length >= 0 ? philosophy.objections.count - removeIds.length : 0;
          }
        } else {
          logger.error('Operation does not match');
          res.status(501).send({"success":false, "message":'Operation does not match'});
        }

        philosophy["UpdatedDate"] = new Date();
        db['philosophies'].findAndModify(
         {_id: db.ObjectID(req.params.id)}, {}, {$set: philosophy},
         {new: true, fields: selectAfterUpdate}, function(err, updatedPhilosophy) {
          if(err) {
            logger.error(err);
            res.status(501).send({"success":false, "message":err});
          }

          if(notification >= 1 && notification <= 3 && !_.isUndefined(philosophy)) {
            // Prepare object for add data in notification collection
            notify.addNotification([{
              'notifyTo': philosophy.userId,
              'notifyBy': req.body.userId,
              'notifyType': (notification == 1 ? "2" : (notification == 2 ? '3' : '4')),
              'philosophyId': philosophy._id
            }]);
          }

          res.status(200).json({"success":true, "data":updatedPhilosophy.value});
        });
      }
    });
  });

  router.get('/:id/:operation/', query.filter,function(req, res, next) {

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
    select["users"] = 1;

    // Build aggregate object for get users details based on operations with information
    req.filter = req.filter || {};
    req.filter['_id'] = db.ObjectID(req.params.id);
    req['projections'] = select;
    req['unwind'] = (req.params.operation == 1 ? "$like.info" : (req.params.operation == 2 ? "$dislike.info" : (req.params.operation == 3 ? "$objections.info" : "")));
    req['localField'] = (req.params.operation == 1 ? "like.info._id" : (req.params.operation == 2 ? "dislike.info._id" : (req.params.operation == 3 ? "objections.info._id" : "")));
    req['sort'] = {'CreatedDate':-1}; // || {username: 1} Need to verify
    var aggregate = aggregation.getQuery(req);

    db['philosophies'].aggregate(aggregate, function(err, information) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(201).json({"success":true, "data":information});
    });
  });

  //http://localhost:3009/philosophies/59ee218a3b9cfd437d788665/likeCount

  router.get('/:id/count/:type',function(req, res, next) {
    //type : like - 1, dislike - 2, objection - 3, reply - 4
    db['philosophies'].findOne({_id: db.ObjectID(req.params.id)}, function(err, philosophy) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      if (req.params.type == 'like') {
        res.status(200).send({"success":true, "count":philosophy.like.count});
      }
      if (req.params.type == 'dislike') {
        res.status(200).send({"success":true, "count":philosophy.dislike.count});
      }
      if (req.params.type == 'objection') {
        res.status(200).send({"success":true, "count":philosophy.objections.count});
      }
      if (req.params.type == 'reply') {
        res.status(200).send({"success":true, "count":philosophy.replyCount});
      }
    });
  });

  module.exports = router;

})();
