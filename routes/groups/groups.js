/**
* @name routes/groups/groups.js
* @author Prachi Thakkar <jaydip.vaghela@gmail.com>
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
  router.get('/users', function(req, res, next) {
    // Need to aggregate - Jaydip
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

router.post('/', function(req, res, next) {
  var postGroup = {};

  postGroup["CreatedDate"] = new Date();
  postGroup["UpdatedDate"] = new Date(); // there should be always to date for any insert object CreatedDate and UpdatedDate - Jaydip
  postGroup["groupName"] = req.body.groupName;
  postGroup["adminUserId"] = req.body.userId;

  // No Need to create extra variable directly use _.reduce on req.body.groupMembers - Jaydip
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


router.get('/:id', function(req, res, next) {
  var aggregate = [{
      "$match": { _id: db.ObjectID(req.params.id)}
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

router.delete('/:id', function(req, res, next) {
  db['groups'].findOneAndDelete({_id:db.ObjectID(req.params.id), adminUserId: db.ObjectID(req.body.userId)}, function(err, data){
    if (_.isNull(data.value)) {
      res.status(501).send({"success":false, "message":'Error while canceling the group.'});
    }else {
      res.status(200).json({"success":true, "message":'Group cancelled.'});
    }
  });
});

//You can not add logedIn user/Admin User Id 's Id in removeMembers.
router.patch('/:id', function(req, res, next) {
  var patch = {};

  // if there is no groupName and removeMembers then What you don't get reply of that request - Jaydip
  if (req.body.groupName || req.body.removeMembers) {
    db['groups'].findOne({_id:db.ObjectID(req.params.id), adminUserId: db.ObjectID(req.body.userId)}, function(err, data){
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      if (!data) {
        res.status(501).send({"success":false, "message":'Group Not Found.'});
      }else {

        // unclear why you doing this? - Jaydip
        if (req.body.groupName) {
          patch["groupName"] = req.body.groupName;
        }else {
          patch["groupName"] = data.groupName;
        }

        // This is not good code need to change it - Jaydip
        if (req.body.removeMembers && req.body.addMembers) {
          var arrayRemove = _.filter(data.groupMembers, function(id) {
            return req.body.removeMembers.indexOf(id.toString()) == -1;
          });

          // Same here need to use reduce - Jaydip
          var objectId = [];
          _.forIn(req.body.addMembers, function(id) {
            objectId.push(db.ObjectID(id));
          });
          patch["groupMembers"] = arrayRemove.concat(objectId);
        }else if(req.body.removeMembers){
          patch["groupMembers"] = _.filter(data.groupMembers, function(id) {
            return req.body.removeMembers.indexOf(id.toString()) == -1;
          });
        }else if(req.body.addMembers){
          var objectId = [];
          _.forIn(req.body.addMembers, function(id) {
            objectId.push(db.ObjectID(id));
          });
          patch["groupMembers"] = data.groupMembers.concat(objectId);
        }else {
          patch["groupMembers"] = data.groupMembers;
        }

        db['groups'].update({_id: db.ObjectID(req.params.id)}, {$set: {groupName : patch["groupName"], groupMembers : patch["groupMembers"]}}, function(err, updatedGroup) {
          if(err) {
            logger.error(err);
            res.status(501).send({"success":false, "message":err});
          }
          // Here might be need to return update document for group - Jaydip
          res.status(200).send({"success":true});
        });
      }
    });
  }
});


  module.exports = router;
})();
