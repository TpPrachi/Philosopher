/**
* @name routes/users/users.js
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
  var _ = require('lodash');
  var query = require('../../lib/query');

  //http://localhost:3009/groups/followedUsers
  router.get('/followedUsers', function(req, res, next) {
    db['follow'].find({followingUser:db.ObjectID(req.body.userId)}, {followedUser:1}).toArray(function(err, followed) {
      if(err) {
        // If we find any error still allow to execute query
        logger.error("Error while getting following information of users for filtering.");
      }
      // Prepare array of all users that logged in user followed.
      var users = _.reduce(followed, function(c, f) {
        c.push({'userId': db.ObjectID(f.followedUser), 'isAdmin' : false});
        return c;
      }, [{'userId': db.ObjectID(req.body.userId), 'isAdmin' : true}]);
      res.status(200).json({success: true, users : users});
    });
  });

router.post('/create', function(req, res, next) {
  var postGroup = {};

  postGroup["createdDate"] = new Date();
  postGroup["groupName"] = req.body.groupName;
  postGroup["adminUserId"] = req.body.userId;
  var objectId = [];
  _.forIn(req.body.groupMembers, function(id) {
    objectId.push(db.ObjectID(id));
  });
  postGroup["groupMembers"] = objectId;

  db['groups'].insert(postGroup, function(err, group) {
    if(err) {
      logger.error(err);
      res.status(501).send({"success":false, "message":err});
    }
    res.status(201).send({"success":true, "message":group.ops[0].groupName + ' creted succefully.'});
  });
});

router.get('/',query.filter , function(req, res, next) {
  db['groups'].find(req.filter, req.options.select || {groupName : 1}, req.options).toArray(function(err, groups) {
    if(err){
      logger.error(err);
      res.status(501).send({"success":false, "message":err});
    }
    res.status(200).json({"success":true, "data":groups});
  });
});


router.get('/:groupId', function(req, res, next) {
  var aggregate = [{
      "$match": { _id: db.ObjectID(req.params.groupId)}
    },{
      $unwind : "$groupMembers"
    },{
      $lookup: {
         from: "usersmapped",
         localField: "groupMembers",
         foreignField: "userId",
         as: "users"
      }
    }
  ];

  db['groups'].aggregate(aggregate, function(err, group) {
    if(err) {
      logger.error(err);
      res.status(501).send({"success":false, "message":err});
    }
    res.status(201).json({"success":true, "data":group});
  });
});


  module.exports = router;
})();
