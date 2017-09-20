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

//Cancel/Delete the group by Admin User Only
router.delete('/:id', function(req, res, next) {
  db['groups'].findOneAndDelete({_id:db.ObjectID(req.params.id), adminUserId: db.ObjectID(req.body.userId)}, function(err, data){
    if (_.isNull(data.value)) {
      res.status(501).send({"success":false, "message":'Error while canceling the group.'});
    }else {
      res.status(200).json({"success":true, "message":'Group cancelled.'});
    }
  });
});

//Leave the group by different user
//group id and that user id (logged in userid)
//red.body.userId or need to pass userid in parameter
router.patch('/leave/:id/:userId', function(req, res, next) {
  db['groups'].findOne({_id:db.ObjectID(req.params.id)}, function(err, data){
    if(err) {
      logger.error(err);
      res.status(501).send({"success":false, "message":err});
    }
    if (!data) {
      res.status(501).send({"success":false, "message":'Group Not Found.'});
    }else {
      data.groupMembers = _.filter(data.groupMembers, function (id) {
        return id.toString() !== req.params.userId;
      });

      // db['groups'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: data}, function(err, group) {
      //   if(err) {
      //     logger.error(err);
      //     res.status(501).send({"success":false, "message":err});
      //   }
      //   // Here might be need to return update document for group - Jaydip - verify
      //   db['groups'].findOne({_id:db.ObjectID(req.params.id)}, function(err, updatedGroup){
      //     if(err) {
      //       logger.error(err);
      //       res.status(501).send({"success":false, "message":err});
      //     }
      //     res.status(200).send({"success":true, group : updatedGroup});
      //   });
      // });
      db['groups'].findAndModify(
        {_id:db.ObjectID(req.params.id)},[],
        { $set : data}, {new : true, upsert:true}, function(err, group) {
        if (err) {
          logger.error(err);
          res.status(501).send({"success":false, "message":err});
        }
        res.status(200).send({"success":true, group : group.value});
      });

    }
  });
});


//You can not add logedIn user/Admin User Id 's Id in removeMembers.
router.patch('/:id', function(req, res, next) {
  var patch = {};

  // if there is no groupName and removeMembers then What you don't get reply of that request - Jaydip - verfiy
  if (req.body.groupName || req.body.removeMembers || req.body.addMembers) {
    db['groups'].findOne({_id:db.ObjectID(req.params.id), adminUserId: db.ObjectID(req.body.userId)}, function(err, data){
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      if (!data) {
        res.status(501).send({"success":false, "message":'Group Not Found.'});
      }else {
        // unclear why you doing this? - Jaydip - verify
        if (req.body.groupName) {
          patch["groupName"] = req.body.groupName;
        }

        patch["groupMembers"] = data.groupMembers;

        if(req.body.removeMembers){
          patch["groupMembers"] = _.filter(patch["groupMembers"], function(id) {
            return req.body.removeMembers.indexOf(id.toString()) == -1;
          });
        }

        if(req.body.addMembers){
          var objectId = [];
          _.forIn(req.body.addMembers, function(id) {
            objectId.push(db.ObjectID(id));
          });
          patch["groupMembers"] = patch["groupMembers"].concat(objectId);
        }
        // db['groups'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: patch}, function(err, group) {
        //   if(err) {
        //     logger.error(err);
        //     res.status(501).send({"success":false, "message":err});
        //   }
        //   // Here might be need to return update document for group - Jaydip - verify
        //   db['groups'].findOne({_id:db.ObjectID(req.params.id)}, function(err, updatedGroup){
        //     if(err) {
        //       logger.error(err);
        //       res.status(501).send({"success":false, "message":err});
        //     }
        //     res.status(200).send({"success":true, group : updatedGroup});
        //   });
        // });
        db['groups'].findAndModify(
          {_id:db.ObjectID(req.params.id)},[],
          { $set : patch}, {new : true, upsert:true}, function(err, group) {
          if (err) {
            logger.error(err);
            res.status(501).send({"success":false, "message":err});
          }
          res.status(200).send({"success":true, group : group.value});
        });
      }
    });
  }else {
    res.status(501).send({"success":false, "message":'Invalid inputs provided.'});
  }
});


  module.exports = router;
})();
