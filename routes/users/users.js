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

  /* Get Old Password Validation */
  router.get('/:userId/:oldPasssword' , function(req, res, next) {
    db['users'].findOne({_id: db.ObjectID(req.params.userId), tempPassword: req.params.oldPasssword}, function(err, user) {
      if (user && _.size(user) > 0) {
        res.status(200).json({success: true, data : user});
      }else {
        logger.error("Provided Old Password is not match with the record.");
        res.status(400).send({"sucess":false, "message":"Provided Old Password is not match with the record."});
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
            var isMatch = true;
            if (isMatch) {
              // if user is found and password is right create a token with jwt standard
              var inputForToken = {};
              inputForToken['_id'] = user.value._id;
              inputForToken['email'] = user.value.email;
              inputForToken['password'] = user.value.password;
              inputForToken['timestamp'] = new Date().getTime();

              var token = jwt.encode(inputForToken, config.secret);
              var UUID = uuidV1();

              // We are store actual token in tokenmapped table and send UUID to authorization token to user with response.
              db['tokenmapped'].findOneAndUpdate({userId : db.ObjectID(user.value._id)},{$set : {token:'JWT ' + token, userId:user.value._id, uuid:UUID, modifiedDate:new Date()}}, function(err, data){
                logger.info('Token Saved to Token Mapped, After Change Password :: ' + JSON.stringify(data));
                res.status(200).json({success: true, token: UUID});
              });
              // return the information including UUID mappend with JWT token
              //res.json({success: true, token: 'JWT ' + token});
            } else {
              logger.info('Authentication failed. Wrong password.');
              res.status(200).send({success: false, message: 'Authentication failed. Wrong password.'});
            }
          });
        });
      });
    }else {
      logger.error("New Password & Confirm Password must be same.");
      res.status(400).send({"sucess":false, "message":"New Password & Confirm Password must be same."});
    }
  });

  /* GET API for ALL records from collection. */
  router.get('/', query.filter, function(req, res, next) {
    var allUsers = [];
    db['users'].find(req.filter, req.options.select || {password:0,tempPassword:0}, req.options).toArray(function(err, users) {
      if(err){
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(users);
    });
  });

  /* GET API for selected record from collection. */
  router.get('/:id', function(req, res, next) {
    db['users'].find({_id: db.ObjectID(req.params.id)},{password:0,tempPassword:0}).toArray(function(err, users) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(users);
    });
  });


  /* PATCH API for update entity values. */
  router.patch('/:id', validate(softSchema) ,function(req, res, next) {
    var patch = req.body;
    patch["UpdatedDate"] = new Date();

    var checkValidityForFullname = true;
    var checkValidityForEmail = true;

    db['users'].find({_id: db.ObjectID(req.params.id)}).toArray(function(err, users) {

      if (users && users[0] && users[0].fullname) {
        if (patch && patch.fullname && patch.fullname ===  users[0].fullname) {
          checkValidityForFullname = false;
          res.status(501).send({"success":false, "message": "Patching the same fullname, Please provide valid data for perform operation."});
        }else {
          checkValidityForFullname = true;
        }
      }

      if (users && users[0] && users[0].email) {
        if (patch && patch.email && patch.email ===  users[0].email) {
          checkValidityForEmail = false;
          res.status(501).send({"success":false, "message": "Patching the same email, Please provide valid data for perform operation."});
        }else {
          checkValidityForEmail = true;
        }
      }

      db['users'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: patch}, {returnOriginal: false}, function(err, data) {
      db['usersmapped'].update({userId: db.ObjectID(req.params.id)}, {$set: patch}, {returnOriginal: false}, function(err, usersmappedData) {

        if(err) {
          logger.error(err);
          res.status(501).send({"success":false, "message":err});
        }
        res.status(200).send({"success":true, "message":usersmappedData.value});
      });

        if(err) {
          logger.error(err);
          res.status(501).send({"success":false, "message":err});
        }
        res.status(200).send({"success":true, "message":data.value});
      });

      // Remove password fields from return object
      if(err){
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(users);
    });

    // Need to change here

  });

  module.exports = router;
})();
