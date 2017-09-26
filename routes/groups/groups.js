/**
* @name routes/groups/groups.js
* @author Prachi Thakkar <prachi281194@gmail.com>
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
  var validate = require('../../lib/validator');
  var schema = require('./schema');
  var softSchema = require('./softSchema');

  //http://localhost:3009/groups/followedUsers
  router.get('/users', query.filter, function(req, res, next) {
    var aggregate = [{
        $lookup: {
           from: "usersmapped",
           localField: 'followedUser',
           foreignField: "userId",
           as: "users"
        }
      },{
          "$match": { followingUser: db.ObjectID(req.body.userId)}
      },{
        $sort: {"users.username" : 1}
      },{
        $skip: req.options.skip
      },{
        $limit: req.options.limit
      }
    ];

    db['follow'].aggregate(aggregate, function(err, users) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(201).json({"success":true, "data": users});
    });

  });

router.post('/', validate(schema), function(req, res, next) {
  var postGroup = {};

  postGroup["CreatedDate"] = new Date();
  postGroup["UpdatedDate"] = new Date();
  postGroup["groupName"] = req.body.groupName;
  postGroup["adminUserId"] = req.body.userId;

  postGroup["groupMembers"] = _.reduce(req.body.groupMembers, function(c, v){
    c.push(db.ObjectID(v));
    return c;
  }, []);

  db['groups'].insert(postGroup, function(err, group) {
    if(err) {
      logger.error(err);
      res.status(501).send({"success":false, "message":err});
    }
    res.status(201).send({"success":true, "message":group.ops[0].groupName + ' creted succefully.'});
  });
});

router.get('/', query.filter, function(req, res, next) {
  db['groups'].find(req.filter, req.options.select || {groupName : 1}, req.options).toArray(function(err, groups) {
    if(err) {
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
  db['groups'].findOneAndDelete({_id:db.ObjectID(req.params.id)}, function(err, data){
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
router.patch('/leave/:id', function(req, res, next) {
  db['groups'].findAndModify(
    {_id:db.ObjectID(req.params.id)},{},
    {$pull: {groupMembers: db.ObjectID(req.body.userId)}},
    {new : true}, function(err, group) {
      if (err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).send({"success":true, data : group.value});
    });
});


//You can not add logedIn user/Admin User Id 's Id in removeMembers.
router.patch('/:id', validate(softSchema), function(req, res, next) {
  var patch = {};

  if(req.body.groupName || req.body.removeMembers || req.body.addMembers) {
    db['groups'].findOne({_id:db.ObjectID(req.params.id), adminUserId: db.ObjectID(req.body.userId)}, function(err, data){
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      if(!data) {
        res.status(501).send({"success":false, "message":'Group Not Found.'});
      } else {
        if (req.body.groupName) {
          patch["groupName"] = req.body.groupName;
        }

        patch["groupMembers"] = data.groupMembers;

        if(req.body.removeMembers) {
          patch["groupMembers"] = _.filter(patch["groupMembers"], function(id) {
            return req.body.removeMembers.indexOf(id.toString()) == -1;
          });
        }

        if(req.body.addMembers) {
          patch["groupMembers"] = patch["groupMembers"].concat(_.reduce(req.body.addMembers, function(c, v){
            c.push(db.ObjectID(v));
            return c;
          }, []));
        }

        db['groups'].findAndModify(
          {_id:db.ObjectID(req.params.id)},[],
          { $set : patch}, {new : true}, function(err, group) {
          if (err) {
            logger.error(err);
            res.status(501).send({"success":false, "message":err});
          }
          res.status(200).send({"success":true, data : group.value});
        });
      }
    });
  }else {
    res.status(501).send({"success":false, "message":'Invalid inputs provided.'});
  }

  //Need To Work On this-------------Start - Prachi
  // var select = {};
  //
  // if (req.body.addMembers) {
  //   req.body.addMembers = _.reduce(req.body.addMembers, function(c, v){
  //     c.push(db.ObjectID(v));
  //     return c;
  //   }, []);
  // }
  // if (req.body.removeMembers) {
  //   req.body.removeMembers = _.reduce(req.body.removeMembers, function(c, v){
  //     c.push(db.ObjectID(v));
  //     return c;
  //   }, []);
  // }
  //
  // if (req.body.removeMembers && req.body.addMembers) {
  //   //Cannot update 'groupMembers' and 'groupMembers' at the same time - Mongo Error - Prachi
  //   select = {$pullAll: {groupMembers: req.body.removeMembers}, $pushAll: {groupMembers: req.body.addMembers}}
  // }else if (req.body.removeMembers) {
  //   select = {$pullAll: {groupMembers: req.body.removeMembers}};
  // }else if (req.body.addMembers) {
  //   select = {$pushAll: {groupMembers: req.body.addMembers}};
  // }
  //
  // db['groups'].findAndModify(
  //   {_id:db.ObjectID(req.params.id)},{},select,{new : true, upsert:true}, function(err, group) {
  //     if (err) {
  //       logger.error(err);
  //       res.status(501).send({"success":false, "message":err});
  //     }
  //     if (!group.value) {
  //       res.status(200).send({"success":true, group : group.value});
  //     }else {
  //       res.status(501).send({"success":false, "message":err});
  //     }
  //
  //   });
  //Need To Work On this-------------End - Prachi
});


  module.exports = router;
})();
