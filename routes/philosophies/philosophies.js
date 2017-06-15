
/**
* @name routes/trends/trends.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
*
* @version 0.0.0
*/

(function(){
  'use strict'
  var express = require('express');
  var router = express.Router();
  var db = require('../../lib/db');
  var validate = require('../../lib/validator');
  var schema = require('./schema');
  var softSchema = require('./softSchema');
  var Joi = require('joi');
  var logger = require('../../lib/logger')
  var _ = require('lodash');


  // Create API for like, dislike, objections and comment update
  // Create single api which return count of all 4 points - may be not needed
  // Create api for getting list of all users who like (all 4) philosophies with username,user profile pic display link, user id
  // How to manage multilevel commnets and there info to display users information

  router.post('/like',function(req, res, next) {

  });


  /* GET API for ALL records from collection. */
  router.post('/comment', function(req, res, next) {
    var post = req.body;
    post['pId'] = db.ObjectID(post['pId']);
    post['createDate'] = new Date();

    db['comments'].insert(post, function(err, d) {
      if(err){
          logger.error(err);
          res.status(501).send({"success":false, "message":err});
      }
      res.status(201).send({"success":true, "message":d.insertedIds});
    });
  });


  /* GET API for ALL records from collection. */
  router.get('/', function(req, res, next) {
    db['philosophies'].find({}).toArray(function(err, data) {
      if(err){
          logger.log(err);
          res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(data);
    });
  });

  /* GET API for selected record from collection. */
  router.get('/:id', function(req, res, next) {
    db['philosophies'].find({_id: db.ObjectID(req.params.id)}).toArray(function(err, data) {
      if(err){
          logger.error(err);
          res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(data);
    });
  });

  /* POST API for insert record in collection. */
  router.post('/', validate(schema), function(req, res, next) {
    var post = req.body;
    post["CreatedDate"] = new Date();
    db['philosophies'].insert(post, function(err, d) {
      if(err){
          logger.error(err);
          res.status(501).send({"success":false, "message":err});
      }
      res.status(201).send({"success":true, "message":d.insertedIds});
    });
  });

  /* PATCH API for update entity values. */
  router.patch('/:id', validate(softSchema) ,function(req, res, next) {
    var patch = req.body;
    patch["UpdatedDate"] = new Date();
    db['philosophies'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: patch}, {returnOriginal: false}, function(err, data) {
      if(err){
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).send({"success":true, "message":data.value});
    });

  });

  router.patch('/:id/:operation' ,function(req, res, next) {
    var patch = {};

    //var getOnePhilosophy = db['philosophies'].findOne({_id: db.ObjectID(req.params.id)},{like:1});

    //Single or multiple call with select query?

    db['philosophies'].find({_id: db.ObjectID(req.params.id)},{like:1, objections:1, dislike:1}).toArray(function(err, data) {
      if(err){
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }

      if (req.params.operation == 1) {
        //Like
        var getUser = _.find(data[0].like.info, {_id:req.body.userId});
        if (!getUser && req.body.userId) {
          data[0].like.info.push({
            _id : req.body.userId,
            date : new Date()
          });
          patch = {
            like:{
              count : data[0].like.count + 1,
              info : data[0].like.info
            }
          }
        }
      }else if (req.params.operation == 2) {
        //Dislike
        var getUser = _.find(data[0].dislike.info, {_id:req.body.userId});
        if (!getUser && req.body.userId) {
          data[0].dislike.info.push({
            _id : req.body.userId,
            date : new Date()
          });
          patch = {
            dislike:{
              count : data[0].dislike.count + 1,
              info : data[0].dislike.info
            }
          }
        }
      }else if (req.params.operation == 3) {
        //objections
        var getUser = _.find(data[0].objections.info, {_id:req.body.userId});
        if (!getUser && req.body.userId) {
          data[0].objections.info.push({
            _id : req.body.userId,
            date : new Date()
          });
          patch = {
            objections:{
              count : data[0].objections.count + 1,
              info : data[0].objections.info
            }
          }
        }
      }else {
        logger.error('Something Wrong !!!');
        res.status(501).send({"success":false, "message":'Something Wrong !!!'});
      }

      if (Object.keys(patch).length > 0) {
        db['philosophies'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: patch}, {returnOriginal: false}, function(err, updatedData) {
          if(err){
            logger.error(err);
            res.status(501).send({"success":false, "message":err});
          }
          res.status(200).send({"success":true, "message":updatedData.value});
        });
      }else {
        logger.error('Something Wrong !!!');
        res.status(501).send({"success":false, "message":'Something Wrong !!!'});
      }
    });
  });


  module.exports = router;

})();
