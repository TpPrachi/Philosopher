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
  var logger = require('../../lib/logger');
  var notify = require('../../lib/notification');
  var validate = require('../../lib/validator');
  var schema = require('./schema');
  var softSchema = require('./softSchema');
    var _ = require('lodash');

  /* GET API for ALL records from collection. */
  router.get('/', function(req, res, next) {

  });

  /* POST API for insert record in collection. */

  //validate(schema) , No need to validate schema because we are passing data after calling post - Prachi

  router.post('/:id/:status', function(req, res, next) { // Need to validate schema
    var post = {};
    //req.params.id : Whom I am going to follow (followedUser)
    //req.body.UID : Logged In user Id (followingUser)
    db['follow'].find({}).toArray(function(err, followData) {
      var getValidUser = _.find(followData,{'followedUser' : db.ObjectID(req.params.id)});
      if (!getValidUser) {
        //if(!_.isUndefined(post.followingUser)) {
        post['followingUser'] = db.ObjectID(req.body.UID); // Need to convert into ObjectID
        //}
        //  if(!_.isUndefined(post.followedUser)) {
        post['followedUser'] = db.ObjectID(req.params.id);
        //  }

        post["createdDate"] = new Date();
        db['follow'].insert(post, function(err, d) {
          if(err) {
            logger.error(err);
            res.status(501).send({"success":false, "message":err});
          }

          // Prepare object for add data in notification table
          var prepareObject = {};
          prepareObject["notifyTo"] = post['followingUser'];
          prepareObject["notifyBy"] = post['followedUser'];
          prepareObject["notifyType"] = "follow";

          // send data
          notify.addNotification(prepareObject).then(function(data){
            res.status(201).send({"success":true, "message":data});
          }, function(err) {
            logger.error(err);
            res.status(501).send({"success":false, "message":err});
          });
        });
      }else {
        db['follow'].remove({followedUser : db.ObjectID(req.params.id)});
        res.status(201).send({"success":true, "message": 'Removed - Unfollow'});
      }
    });
  });

  /* PATCH API for update entity values. */
  router.patch('/:id', function(req, res, next) {
    var patch = req.body;
    patch["UpdatedDate"] = new Date();
    db['follow'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: patch}, {returnOriginal: false}, function(err, d) {
      if(err) {
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).send({"success":true, "message":"Done"});
    });

  });

  module.exports = router;

})();
