
/**
* @name routes/comments/comments.js
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
  var logger = require('../../lib/logger');
  var _ = require('lodash');

  /* GET API for ALL records from collection. */
  router.post('/:id', function(req, res, next) {
    var post = req.body;
    req.body['pId'] = db.ObjectID(req.params.id);
    req.body['userId'] = req.body.UID;
    req.body['createDate'] = new Date();
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
    req.body['commentCount'] = 0;

    db['comments'].insert(req.body, function(err, comment) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(201).send({"success":true, "message":comment.insertedIds});
    });
  });


  /* GET API for ALL records from collection. */
  router.get('/:philosophyId', function(req, res, next) {
    db['comments'].find({pId: req.params.philosophyId}).toArray(function(err, comments) {
      if(err) {
        logger.log(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(comments);
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

    db['comments'].findOne({_id: db.ObjectID(req.params.id)}, select, function(err, comment) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }

      if (req.params.operation == 1) { // For Like
        //var getUser = _.find(comment.like.info, {_id:req.body.UID});
        if (req.params.flag == 'true') {
          comment.like.count = comment.like.count + 1;
          comment.like.info.push({
            _id : req.body.UID,
            date : new Date()
          });
        } else {
          var removeIds = _.remove(comment.like.info, {_id:req.body.UID});
          comment.like.count = comment.like.count - removeIds.length;
          comment.like.count = comment.like.count >= 0 ? comment.like.count : 0;
        }
      } else if (req.params.operation == 2) { // For Dislike
        //var getUser = _.find(comment.dislike.info, {_id:req.body.UID});
        if (req.params.flag == 'true') {
          comment.dislike.count = comment.dislike.count + 1;
          comment.dislike.info.push({
            _id : req.body.UID,
            date : new Date()
          });
        } else {
          var removeIds = _.remove(comment.dislike.info, {_id:req.body.UID});
          comment.dislike.count = comment.dislike.count - removeIds.length;
          comment.dislike.count = comment.dislike.count >= 0 ? comment.dislike.count : 0;
        }
      } else if (req.params.operation == 3) { // For Objections
        //var getUser = _.find(comment.objections.info, {_id:req.body.UID});
        if (req.params.flag == 'true') {
          comment.objections.count = comment.objections.count + 1;
          comment.objections.info.push({
            _id : req.body.UID,
            date : new Date()
          });
        } else {
          var removeIds = _.remove(comment.objections.info, {_id:req.body.UID});
          comment.objections.count = comment.objections.count - removeIds.length;
          comment.objections.count = comment.objections.count >= 0 ? comment.objections.count : 0;
        }
      } else {
        logger.error('Operation does not match');
        res.status(501).send({"success":false, "message":'Operation does not match'});
      }

      db['comments'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: comment}, {returnOriginal: false}, function(err, updatedcomment) {
        if(err) {
          logger.error(err);
          res.status(501).send({"success":false, "message":err});
        }
        res.status(200).send({"success":true, "message":updatedcomment.value});
      });
    });
  });

  module.exports = router;

})();
