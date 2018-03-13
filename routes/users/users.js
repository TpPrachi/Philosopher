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
  var validate = require('../../lib/validator');
  var schema = require('./schema');
  var softSchema = require('./softSchema');
  var Joi = require('joi');
  var logger = require('../../lib/logger')(__filename);
  var _ = require('lodash');
  var query = require('../../lib/query');
  var bcrypt = require('bcrypt');
  var jwt = require('jwt-simple');
  var config = require('../../config');
  const uuidV1 = require('uuid/v1');
  var mailer = require('../../lib/mailer');

  /* Get Old Password Validation */
  router.get('/:userId/:oldPasssword' , function(req, res, next) {
    // http://localhost:3009/users/59a19da699728f7dea3b5741/AdminUpdate777@123
    db['users'].findOne({_id: db.ObjectID(req.params.userId), tempPassword: req.params.oldPasssword}, function(err, user) {
      if (user && _.size(user) > 0) {
        res.status(200).json({success: true, data : user});
      }else {
        logger.error("Provided Old Password is not match with the record.");
        res.status(400).send({"success":false, "message":"Provided Old Password is not match with the record."});
      }
    });
  });

  /* Change Password */
  router.patch('/:userId/change-password', function (req,res,next) {
    //Old New Confirm Password
    //Need to compare here that old password and new password is same or not / we can handel it from UI ?
    //Need to genrate new token from new password?
    if (req.body.newPassword == req.body.confirmPassword) {

      bcrypt.genSalt(10, function (err, salt) {
        if (err) {
          logger.error(err);
          res.status(500).send({success: false, message: 'Something went wrong.'});
        }
        // Bcrypt hash() method for generate hash of password
        bcrypt.hash(req.body.newPassword, salt, function (err, hashNewPassword) {
          if (err) {
            logger.error(err);
            res.status(500).send({success: false, message: 'Something went wrong.'});
          }
          db['users'].findOneAndUpdate({_id: db.ObjectID(req.params.userId)}, {$set: {
            password: hashNewPassword,
            tempPassword: req.body.newPassword,
            modifiedDate: new Date()}
          }, {returnOriginal: false}, function(err, user) {
            logger.info('Change Password successfully.');
            // Compare req password hash with usered store password hash
            db['users'].findOne({_id: db.ObjectID(req.params.userId)}, function(err, updatedUser) {
              var inputForToken = {};
              inputForToken['_id'] = updatedUser._id;
              inputForToken['email'] = updatedUser.email;
              inputForToken['password'] = updatedUser.password;
              inputForToken['timestamp'] = new Date().getTime();

              var token = jwt.encode(inputForToken, config.secret);
              var UUID = uuidV1();

              // We are store actual token in tokenmapped table and send UUID to authorization token to user with response.
              db['tokenmapped'].findOneAndUpdate({userId : db.ObjectID(updatedUser._id)},{$set : {token:'JWT ' + token, userId:updatedUser._id, uuid:UUID, modifiedDate:new Date()}}, function(err, data){
                logger.info('Token Saved to Token Mapped, After Change Password :: ' + JSON.stringify(data));

                mailer.send('finish-change-password', updatedUser, updatedUser.email, function sendMailCallback(e, b) {
                  if (e) {
                    logger.error('User change password successfully.');
                    logger.info(updatedUser);
                    logger.error(e);
                  } else {
                    logger.info(updatedUser.email.underline + ' got registered successfully');
                  }
                });
                delete updatedUser.password;
                delete updatedUser.tempPassword;
                delete updatedUser.oldPasssword;
                res.status(200).json({success: true, token: UUID, user : updatedUser});
              });
            });
          });
        });
      });
    }else {
      logger.error("New Password & Confirm Password must be same.");
      res.status(400).send({"success":false, "message":"New Password & Confirm Password must be same."});
    }
  });

  /* GET API for ALL records from collection. */
  router.get('/', query.filter, function(req, res, next) {
    var allUsers = [];
    db['users'].find(req.filter, req.options.select || {password:0, tempPassword:0, oldPasssword:0}, req.options).toArray(function(err, users) {
      if(err){
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json({"success":true, "data":users});
    });
  });

  // /* GET API for provide list of users for suggestion */
  router.get('/suggestion', query.filter, function(req, res, next) {
    db['follow'].find({followingUser:db.ObjectID(req.body.userId)}, {followedUser:1}).toArray(function(err, followed) {
      if(err) {
        logger.error("Error while fetching following information :: " + err);
        res.status(501).send({"success":false, "message":err});
      }
      // Prepare array of all users that logged in user followed.
      req.filter['_id'] = {};
      req.filter['_id']['$nin'] = _.reduce(followed, function(c, f) {
        c.push(db.ObjectID(f.followedUser));
        return c;
      }, [db.ObjectID(req.body.userId)]);

      db['users'].find(req.filter, req.options.select || {password:0, tempPassword:0, oldPasssword:0}, req.options).toArray(function(err, users) {
        if(err) {
          logger.error(err);
          res.status(501).send({"success":false, "message":err});
        }
        res.status(200).json({"success":true, "data":users});
      });
    });
  });

  /* GET API for selected record from collection. */
  router.get('/:id', function(req, res, next) {
    db['users'].findOne({_id: db.ObjectID(req.params.id)},{password:0,tempPassword:0 ,oldPasssword:0}, function(err, user) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      // If no user found then return invalid data.
      if(user == null) {
        res.status(501).json({"success":false, "message": "Please provide valid infomation."});
      } else {
        // if user found then add isFollow property after checking in follow collection
        db['follow'].find({followingUser:db.ObjectID(req.body.userId), followedUser: db.ObjectID(req.params.id)}).toArray(function(err, followed) {
          if(followed.length > 0) { // if follow information found then return true else false
            user['isFollow'] = true;
          } else {
            user['isFollow'] = false;
          }

          db['block'].findOne({blockTo:db.ObjectID(req.params.id), userId:db.ObjectID(req.body.userId)}, function(err, blocked){
            if(blocked == null) {
              user['isBlocked'] = false;
            } else {
              user['isBlocked'] = true;
            }

            res.status(200).json({"success":true, "data":user});
          });

        });
      }

    });
  });

  function doUserOperations(patch,req,res) {
    db['users'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: patch}, {returnOriginal: false}, function(err, data) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      var select = _.pick(data.value, ['email', 'fullname', 'biolosophy','location', 'username', 'profilePhoto', 'communityCount', 'email']);
      db['usersmapped'].update({userId: db.ObjectID(req.params.id)}, {$set: select}, {returnOriginal: false}, function(err, usersmappedData) {
        //res.status(200).send({"success":true, "message":usersmappedData.value});
        if(err) {
          logger.error(err);
          res.status(501).send({"success":false, "message":err});
        }
        delete data.value.password;
        delete data.value.tempPassword;
        delete data.value.oldPassword;
        res.status(200).send({"success":true, "data":data.value});
      });
    });
  }

  /* PATCH API for update entity values. */
  router.patch('/:id', validate(softSchema) ,function(req, res, next) {
    var patch = req.body;
    patch["UpdatedDate"] = new Date();
    if (patch.email || patch.username) {
      db['users'].findOne({$or : [{email : patch.email}, {username : patch.username}]}, function(err, getUser) {
        if (!getUser) {
          doUserOperations(patch,req,res);
        }else {
          if (getUser.username == patch.username) {
            logger.error("Username must be unique.");
            res.status(500).send({"success":false, "message":"Username must be unique."});
          }else if (getUser.email == patch.email) {
            logger.error("Email Id must be unique.");
            res.status(500).send({"success":false, "message":"Email Id must be unique."});
          }else {
            logger.error("Please provide valid information for signup user.");
            res.status(500).send({"success":false, "message":"Please provide valid information for signup user."});
          }
        }
      });
    }else {
      doUserOperations(patch,req,res);
    }
  });

  module.exports = router;
})();
