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
      var users = [];
      // Prepare array of all users that logged in user followed.
      users = _.reduce(followed, function(c, f) {
        c.push({'userId': db.ObjectID(f.followedUser), 'isAdmin' : false});
        return c;
      }, [{'userId': db.ObjectID(req.body.userId), 'isAdmin' : true}]);
      res.status(200).json({success: true, users : users});
    });
  });

//   Responce : {
//     "success": true,
//     "users": [
//         {
//             "userId": "59b69dee3985b53cac5a133c",
//             "isAdmin": true
//         },
//         {
//             "userId": "59b69d6133a5953c0d62a40e",
//             "isAdmin": false
//         },
//         {
//             "userId": "599ec31b2e26d4258855d5a2",
//             "isAdmin": false
//         },
//         {
//             "userId": "5973af82cbc7a6363618b92a",
//             "isAdmin": false
//         }
//     ]
// }

// Input for create user

// {
// 	"groupName" : "My First Group",
// 	"groupMembers" : [{
//     "userId": "59b69dee3985b53cac5a133c",
//     "isAdmin": true
//   },
//   {
//     "userId": "59b69d6133a5953c0d62a40e",
//     "isAdmin": false
//   },
//   {
//     "userId": "599ec31b2e26d4258855d5a2",
//     "isAdmin": false
//   }]
// }

router.post('/create', function(req, res, next) {
  var postGroup = {};

  postGroup["CreatedDate"] = new Date();
  postGroup["groupName"] = req.body.groupName;
  postGroup["adminUserId"] = req.body.userId;
  postGroup["groupMembers"] = req.body.groupMembers;

  db['groups'].insert(postGroup, function(err, group) {
    if(err) {
      logger.error(err);
      res.status(501).send({"success":false, "message":err});
    }
    console.log(group);
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
  db['groups'].findOne({_id:db.ObjectID(req.params.groupId)}, function(err, group) {
    if(err){
      logger.error(err);
      res.status(501).send({"success":false, "message":err});
    }
    console.log(group);
    res.status(200).json({"success":true, "data":group});
  });
});

router.get('/:adminUserId', query.filter, function(req, res, next) {
  // Build aggregate object for get users details based on following information
  //groupId : 59c0185766dc9277e78d262d
  var aggregate = [{
      "$match": { adminUserId: db.ObjectID(req.params.adminUserId)}
    },{
      $lookup: {
         from: "usersmapped",
         localField: 'adminUserId',
         foreignField: "userId",
         as: "users"
      }
    },{
      $sort: {"users.fullname" : 1}
    }
  ];
  //
  db['groups'].aggregate(aggregate, function(err, group) {
    if(err) {
      logger.error(err);
      res.status(501).send({"success":false, "message":err});
    }
    console.log(group);
    res.status(201).json({"success":true, "data":group});
  });
});


    module.exports = router;
  })();
