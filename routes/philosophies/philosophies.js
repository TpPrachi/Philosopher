
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
  router.post('/', function(req, res, next) {
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
    //Single or multiple call with select query?
    var select = {};

    if(!_.isUndefined(req.params.operation) && req.params.operation == 1 ){
      select['like'] = 1;
    } else if(!_.isUndefined(req.params.operation) && req.params.operation == 2){
      select['dislike'] = 1;
    } else if(!_.isUndefined(req.params.operation) && req.params.operation == 3){
      select['objections'] = 1;
    }

    db['philosophies'].findOne({_id: db.ObjectID(req.params.id)}, select, function(err, data) {
      logger.info("data" + JSON.stringify(data));
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }

      if (req.params.operation == 1) {
        //Like
        var getUser = _.find(data.like.info, {_id:req.body.userId});
        if (!getUser && req.body.userId) {
          data.like.info.push({
            _id : req.body.UID,
            date : new Date()
          });

          // Need to improve
          // data.like.count = data.like.count + 1; -- add this line
          // and direct udpate data instaed of patch in update query
          // I think that's working fine, We does not require to create object of patch = {}
          // using this we get better response for post api
          // May be {$set: patch} aa portion ma koi change aavse k aene proper data update karva mate object aapvu padse to aee  joiee lejo
          
          patch = {
            like:{
              count : data.like.count + 1,
              info : data.like.info
            }
          }
        }
      } else if (req.params.operation == 2) {
        //Dislike
        var getUser = _.find(data.dislike.info, {_id:req.body.userId});
        if (!getUser && req.body.userId) {
          data.dislike.info.push({
            _id : req.body.UID,
            date : new Date()
          });
          patch = {
            dislike:{
              count : data.dislike.count + 1,
              info : data.dislike.info
            }
          }
        }
      } else if (req.params.operation == 3) {
        //objections
        var getUser = _.find(data.objections.info, {_id:req.body.userId});
        if (!getUser && req.body.userId) {
          data.objections.info.push({
            _id : req.body.UID,
            date : new Date()
          });
          patch = {
            objections: {
              count : data.objections.count + 1,
              info : data.objections.info
            }
          }
        }
      } else {
        logger.error('Operation does not match');
        res.status(501).send({"success":false, "message":'Operation does not match'});
      }

      if (Object.keys(patch).length > 0) {
        db['philosophies'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: patch}, {returnOriginal: false}, function(err, updatedData) {
          if(err){
            logger.error(err);
            res.status(501).send({"success":false, "message":err});
          }
          res.status(200).send({"success":true, "message":updatedData.value});
        });
      } else {
        logger.error('Something Wrong !!!');
        res.status(501).send({"success":false, "message":'Something Wrong !!!'});
      }
    });
  });


  module.exports = router;

})();
