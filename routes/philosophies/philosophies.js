
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
  var logger = require('../../lib/logger')
  var _ = require('lodash');


  // Create single api which return count of all 4 points - may be not needed
  // Create api for getting list of all users who like (all 4) philosophies with username,user profile pic display link, user id
  // How to manage multilevel commnets and there info to display users information

  /* GET API for ALL records from collection. */
  router.get('/', function(req, res, next) {
    db['philosophies'].find({}).toArray(function(err, philosophies) {
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
  router.post('/', function(req, res, next) {
    var post = req.body;
    req.body["CreatedDate"] = new Date();
    req.body["UpdatedDate"] = new Date();
    req.body["userId"] = req.body.UID;
    req.body["commentCount"] = 0;
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
    db['philosophies'].insert(req.body, function(err, philosophy) {
      if(err){
          logger.error(err);
          res.status(501).send({"success":false, "message":err});
      }
      res.status(201).send({"success":true, "message":philosophy.insertedIds});
    });
  });

  /* PATCH API for update entity values. */
  router.patch('/:id', validate(softSchema) ,function(req, res, next) {
    var patch = req.body;
    patch["UpdatedDate"] = new Date();
    db['philosophies'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: patch}, {returnOriginal: false}, function(err, philosophy) {
      if(err){
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).send({"success":true, "message":philosophy.value});
    });

  });

  router.patch('/:id/:operation/:flag' ,function(req, res, next) {
    //Single or multiple call with select query?
    var select = {};

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

      if (req.params.operation == 1) { // For Like
        //var getUser = _.find(philosophy.like.info, {_id:req.body.UID});
        if (req.params.flag == 'true') {
          philosophy.like.count = philosophy.like.count + 1;
          philosophy.like.info.push({
            _id : req.body.UID,
            date : new Date()
          });
        } else {
          var removeIds = _.remove(philosophy.like.info, {_id:req.body.UID});
          philosophy.like.count = philosophy.like.count - removeIds.length;
          philosophy.like.count = philosophy.like.count >= 0 ? philosophy.like.count : 0;
        }
      } else if (req.params.operation == 2) { // For Dislike
        //var getUser = _.find(philosophy.dislike.info, {_id:req.body.UID});
        if (req.params.flag == 'true') {
          philosophy.dislike.count = philosophy.dislike.count + 1;
          philosophy.dislike.info.push({
            _id : req.body.UID,
            date : new Date()
          });
        } else {
          var removeIds = _.remove(philosophy.dislike.info, {_id:req.body.UID});
          philosophy.dislike.count = philosophy.dislike.count - removeIds.length;
          philosophy.dislike.count = philosophy.dislike.count >= 0 ? philosophy.dislike.count : 0;
        }
      } else if (req.params.operation == 3) { // For Objections
        //var getUser = _.find(philosophy.objections.info, {_id:req.body.UID});
        if (req.params.flag == 'true') {
          philosophy.objections.count = philosophy.objections.count + 1;
          philosophy.objections.info.push({
            _id : req.body.UID,
            date : new Date()
          });
        } else {
          var removeIds = _.remove(philosophy.objections.info, {_id:req.body.UID});
          philosophy.objections.count = philosophy.objections.count - removeIds.length;
          philosophy.objections.count = philosophy.objections.count >= 0 ? philosophy.objections.count : 0;
        }
      } else {
        logger.error('Operation does not match');
        res.status(501).send({"success":false, "message":'Operation does not match'});
      }

      db['philosophies'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: philosophy}, {returnOriginal: false}, function(err, updatedPhilosophy) {
        if(err) {
          logger.error(err);
          res.status(501).send({"success":false, "message":err});
        }
        res.status(200).send({"success":true, "message":updatedPhilosophy.value});
      });
    });
  });

  module.exports = router;

})();
