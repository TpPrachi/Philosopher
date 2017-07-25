/**
* @name lib/oauth/authorization.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
*
* @version 0.0.1
*/

(function() {
  'use strict'
  var express = require('express');
  var router = express.Router();
  var bcrypt = require('bcrypt');
  var jwt = require('jwt-simple');
  var db = require('../db');
  var config = require('../../config');
  var _ = require('lodash');
  var logger = require('../logger');
  const uuidV1 = require('uuid/v1');

  /* Post API for signup new users. */
  router.post('/signup', function(req, res, next) {
    var user = req.body;
    db['users'].find({email : user.email}).toArray(function(err, getUser) {
      if (getUser.length == 0) {
        user.tempPassword = user.password;
        if(!_.isUndefined(user) && (!_.isUndefined(user.password) && user.password != '') && (!_.isUndefined(user.email) && user.email != '') && (!_.isUndefined(user.fullname) && user.fullname != '')) {
            // Bcrypt module for generate salt for provide input to hash generation process
            bcrypt.genSalt(10, function (err, salt) {
                if (err) {
                  logger.error(err);
                  res.status(500).send({"sucess":false, "message":err});
                }
                // Bcrypt hash() method for generate hash of password
                bcrypt.hash(user.password, salt, function (err, hash) {
                    if (err) {
                      logger.error(err);
                      return next(err);
                    }
                    // Store generated hash to actual users object
                    user.password = hash;
                    // Creating user with hash of password
                    db['users'].insert(user, function(err, data) {
                      if(err) {
                        logger.error(err);
                        res.status(500).send({"sucess":false, "message":err});
                      }
                      // For holding users info to usermapped table for get better performance when we need user detail using $lookup other tables
                      db['usersmapped'].insert({userId:data.insertedIds[0], fullname:user.fullname, email:user.email});

                      res.status(200).send({"sucess":true, "message":"User created successfully."});
                    });
                });
            });
        } else {
          logger.error("Username or Password is not provided");
          res.status(500).send({"sucess":false, "message":"Please provide password."});
        }
      }else {
        logger.error("Email Id is already used");
        res.status(500).send({"sucess":false, "message":"Email Id is already used."});
      }
    });


  });


  /* Post API for signup new users. */
  router.post('/login', function(req, res, next) {
    if(!_.isUndefined(req.body.email) && !_.isUndefined(req.body.password)) {
      db['users'].findOne({
        email: req.body.email
      }, function(err, user) {
        if (err) {
          logger.error(err);
          throw err;
        }

        if (!user) {
          res.send({success: false, message: 'Authentication failed. User not found.'});
        } else {
          // code for generate salt
          bcrypt.genSalt(10, function (err, salt) {
              if (err) {
                logger.error(err);
                res.status(500).send({success: false, message: 'Authentication failed. Wrong password.'});
              }
              // Bcrypt hash() method for generate hash of password
              bcrypt.hash(req.body.password, salt, function (err, hash) {
                  if (err) {
                    logger.error(err);
                    res.status(500).send({success: false, message: 'Authentication failed. Wrong password.'});
                  }

                  // Compare req password hash with usered store password hash
                  comparePassword(req.body.password, user.password, function (err, isMatch) {
                    if (isMatch && !err) {
                      // if user is found and password is right create a token with jwt standard
                      var inputForToken = {};
                      inputForToken['_id'] = user._id;
                      inputForToken['email'] = user.email;
                      inputForToken['password'] = user.password;
                      inputForToken['timestamp'] = new Date().getTime();

                      var token = jwt.encode(inputForToken, config.secret);
                      var UUID = uuidV1();

                      // We are store actual token in tokenmapped table and send UUID to authorization token to user with response.
                      db['tokenmapped'].insert({token:'JWT ' + token, userId:user._id, uuid:UUID,createDate:new Date()}, function(err, data){
                        console.log("Token Saved to Token Mapped");
                      });
                      // return the information including UUID mappend with JWT token
                      //res.json({success: true, token: 'JWT ' + token});
                      res.status(200).json({success: true, token: UUID});
                    } else {
                      logger.error('Authentication failed. Wrong password.');
                      res.status(200).send({success: false, message: 'Authentication failed. Wrong password.'});
                    }
                  });
              });
          });
        }
      });
    } else {
      res.status(500).send({success: false, message: 'Please provide username or password.'});
    }

  });

  // Method for compare hashes using bcrypt module
  var comparePassword = function (passw, userPassword, cb) {
    bcrypt.compare(passw, userPassword, function (err, isMatch) {
      if (err) {
        logger.error(err);
        return cb(err);
      }
      cb(null, isMatch);
    });
  };

  module.exports = router;

})();
