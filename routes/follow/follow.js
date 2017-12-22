/**
* @name routes/follow/follow.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
*
* @version 0.0.0
*/

(function(){
  'use strict'
  var express = require('express');
  var router = express.Router();
  var db = require('../../lib/db');
  var logger = require('../../lib/logger')(__filename);
  var notify = require('../../lib/notification');
  var query = require('../../lib/query');
  var aggregation = require("../../lib/aggregate");

  /* Get api for getting followed users based on id */
  router.get('/:id', query.filter, function(req, res, next) {
    req.filter = req.filter || {};
    req.filter['followingUser'] = db.ObjectID(req.params.id);
    req['localField'] = 'followedUser';
    req['sort'] = {"users.username" : 1};
    var aggregate = aggregation.getQuery(req);

    db['follow'].aggregate(aggregate, function(err, information) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(201).json({"success":true, "data":information});
    });
  });

  /* POST API  Follow or Unfollow users based in request params */
  router.post('/:id/:status', function(req, res, next) {
    var post = {};
    //req.params.id : Whom I am going to follow (followedUser)
    //req.body.userId : Logged In user Id (followingUser)
    //25 July, 2017
    if(req.params.status == 1) {
      db['follow'].find({followedUser:db.ObjectID(req.params.id),followingUser:db.ObjectID(req.body.userId)}).toArray(function(err, followData) {
        if (followData.length == 0) {
          post['followingUser'] = db.ObjectID(req.body.userId);
          post['followedUser'] = db.ObjectID(req.params.id);
          post["createdDate"] = new Date();

          db['follow'].insert(post, function(err, d) {
            if(err) {
              logger.error(err);
              res.status(501).send({"success":false, "message":err});
            }

            // Prepare object for add data in notification table
            var prepareObject = {};
            prepareObject["notifyTo"] = post['followedUser'];
            prepareObject["notifyBy"] = post['followingUser'];
            prepareObject["notifyType"] = "1";

            //  update notification for add user in community
            notify.addNotification([prepareObject]);

            // Code for increment community count of logged in user
            db['users'].findOneAndUpdate({_id: db.ObjectID(req.body.userId)}, {$inc: { communityCount: 1}});

            res.status(201).send({"success":true, "message":"Users added succesfully in your community."});

          });
        } else {
          res.status(501).send({"success":false, "message": "Please provide valid information for add user in community."});
        }
      });
    } else if(req.params.status == 0) {
      // remove user from community
      db['follow'].remove({followedUser:db.ObjectID(req.params.id),followingUser:db.ObjectID(req.body.userId)});
      // For decrement count of community
      db['users'].findOneAndUpdate({_id: db.ObjectID(req.body.userId), communityCoun: {$gt : 0}}, {$inc: { communityCount: -1}});
      res.status(201).send({"success":true, "message": 'Removed - Unfollow'});
    } else {
      res.status(501).send({"success":true, "message": 'Please provide valid information.'});
    }
  });

  module.exports = router;
})();
