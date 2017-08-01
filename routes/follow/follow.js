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
  router.get('/:id', function(req, res, next) {
    // Build aggregate object for get users details based on operations with information
    logger.info('Here for get following info');
    var aggregate = [{
        "$match": { followingUser: db.ObjectID(req.params.id)}
      },{
        $lookup:{
           from: "usersmapped",
           localField: 'followedUser',
           foreignField: "userId",
           as: "users"
        }
      },{
        $sort: {"users.fullname" : 1}
        // $sort: 'fullname'
        //$skip - $limit
      }
    ];
    //
    db['follow'].aggregate(aggregate, function(err, information) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(201).json(information);
    });
  });

  /* POST API for insert record in collection. */

  //validate(schema) , No need to validate schema because we are passing data after calling post - Prachi

  router.post('/:id/:status', function(req, res, next) {
    var post = {};
    //req.params.id : Whom I am going to follow (followedUser)
    //req.body.UID : Logged In user Id (followingUser)
    //25 July, 2017
    if(req.params.status == 1) {
      db['follow'].find({followedUser:db.ObjectID(req.params.id),followingUser:db.ObjectID(req.body.UID)}).toArray(function(err, followData) {
        if (followData.length == 0) {
          post['followingUser'] = db.ObjectID(req.body.UID);
          post['followedUser'] = db.ObjectID(req.params.id);
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

            //  update notification for add user in community
            notify.addNotification(prepareObject).then(function(data) {
              // For increment count of community
              db['users'].findOneAndUpdate({_id: db.ObjectID(req.body.UID)}, {$inc: { communityCount: 1}});
              res.status(201).send({"success":true, "message":data});
            }, function(err) {
              logger.error(err);
              res.status(501).send({"success":false, "message":err});
            });
          });
        } else {
          res.status(501).send({"success":false, "message": "Please provide valid information for add user in community."});
        }
      });
    } else if(req.params.status == 0) {
      // remove user from community
      db['follow'].remove({followedUser:db.ObjectID(req.params.id),followingUser:db.ObjectID(req.body.UID)});
      // For decrement count of community
      db['users'].findOneAndUpdate({_id: db.ObjectID(req.body.UID)}, {$inc: { communityCount: -1}});
      res.status(201).send({"success":true, "message": 'Removed - Unfollow'});
    } else {
      res.status(501).send({"success":true, "message": 'Please provide valid information.'});
    }
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
