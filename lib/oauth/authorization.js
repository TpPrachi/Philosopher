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
  var logger = require('../logger')(__filename);
  const uuidV1 = require('uuid/v1');
  var mailer = require('../mailer');

  /* Post API for signup new users. */
  router.post('/signup', function(req, res, next) {
    var user = req.body;
    db['users'].find({email : user.email}).toArray(function(err, getUser) {
      if (getUser.length == 0) {
        // Prepare blank data for return during api response.
        user.tempPassword = user.password;
        user.communityCount = 0;
        user.fullname = "";
        user.biolosophy = "";
        user.location = "";
        user.profilePicture = "";

        if(!_.isUndefined(user) && (!_.isUndefined(user.password) && user.password != '') && (!_.isUndefined(user.email) && user.email != '') && (!_.isUndefined(user.username) && user.username != '')) {
          // Bcrypt module for generate salt for provide input to hash generation process
          bcrypt.genSalt(10, function (err, salt) {
            if (err) {
              logger.error(err);
              res.status(500).send({"success":false, "message":err});
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
                  res.status(500).send({"success":false, "message":err});
                }
                // For holding users info to usermapped table for get better performance when we need user detail using $lookup other tables
                db['usersmapped'].insert({userId:data.insertedIds[0], username:user.username, email:user.email});

                mailer.send('sign-up', user, user.email, function sendMailCallback(e, b) {
                  if (e) {
                    logger.error('User created successfully.');
                    logger.info(user);
                    logger.error(e);
                  } else {
                    logger.info(user.email + ' got registered successfully');
                  }
                });

                // Generate token during signup and send in successful response.
                var inputForToken = {};
                inputForToken['_id'] = user._id;
                inputForToken['email'] = user.email;
                inputForToken['password'] = user.password;
                inputForToken['timestamp'] = new Date().getTime();

                var token = jwt.encode(inputForToken, config.secret);
                var UUID = uuidV1();

                // We are store actual token in tokenmapped table and send UUID to authorization token to user with response.
                db['tokenmapped'].insert({token:'JWT ' + token, userId:user._id, uuid:UUID,createDate:new Date()}, function(err, data){
                  logger.info("Token Saved to Token Mapped");
                });
                // return the information including UUID mappend with JWT token
                delete user.tempPassword; // remove password from information
                delete user.password;

                res.status(200).send({"success":true, "message":"User created successfully.", token: UUID, user: user});
              });
            });
          });
        } else {
          logger.error("Please provide valid information for signup user.");
          res.status(500).send({"success":false, "message":"Please provide valid information for signup user."});
        }
      }else {
        logger.error("Email Id is already used");
        res.status(500).send({"success":false, "message":"Email Id is already used."});
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
          res.status(500).send({success: false, message: 'Authentication failed while finding user information.'});
        }
        if (!user) {
          res.send({success: false, message: 'Authentication failed. User not found.'});
        }else {
          // Compare req password hash with usered store password hash
          comparePassword(req.body.password, user.password, function (err, isMatch) {
            if (isMatch && !err) {
              // Code for check user already login? If yes then return token directly from maaped table else generate new one
              db['tokenmapped'].findOne({
                userId: user._id
              }, function(err, mappedUser) {
                if (err) {
                  logger.error(err);
                  res.status(500).send({success: false, message: 'Authentication failed while finding mapped information.'});
                }
                // check for user id is present in mapped table or not
                if (!mappedUser) {
                  //if user is found and password is right create a token with jwt standard
                  var inputForToken = {};
                  inputForToken['_id'] = user._id;
                  inputForToken['email'] = user.email;
                  inputForToken['password'] = user.password;
                  inputForToken['timestamp'] = new Date().getTime();

                  var token = jwt.encode(inputForToken, config.secret);
                  var UUID = uuidV1();

                  // We are store actual token in tokenmapped table and send UUID to authorization token to user with response.
                  db['tokenmapped'].insert({token:'JWT ' + token, userId:user._id, uuid:UUID,createDate:new Date()}, function(err, data){
                    logger.info("Token Saved to Token Mapped");
                  });
                  // return the information including UUID mappend with JWT token
                  delete user.tempPassword; // remove password from information
                  delete user.password;
                  delete user.oldPasssword;

                  res.status(200).json({success: true, token: UUID, user: user});
                }else {
                  delete user.tempPassword; // remove password from information
                  delete user.password;
                  delete user.oldPasssword
                  res.send({success: true, token: mappedUser.uuid, user: user});
                }
              });
            }else {
              logger.error('Authentication failed. Wrong password.');
              res.status(500).send({success: false, message: 'Authentication failed. Wrong password.'});
            }
          });
        }
      });
    }
  });

  // UserId kevi rite send karse aeee question 6 forgot password ma? - Jaydip
  router.patch('/forgot-password/:email', function (req,res,next) {
    db['users'].findOne({email: req.params.email}, function(err, user) {
      if (err) {
        logger.error(err);
        res.status(500).send({success: false, message: 'Authentication failed while finding user information.'});
      }
      if (!user) {
        res.send({success: false, message: 'Authentication failed. User not found.'});
      }else {

        user['oldPasssword'] = user.tempPassword;
        user['password'] = Math.random().toString(36).slice(-8);
        user['tempPassword'] = user['password'];

        bcrypt.genSalt(10, function (err, salt) {
          if (err) {
            logger.error(err);
            res.status(500).send({"success":false, "message":err});
          }
          // Bcrypt hash() method for generate hash of password
          bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) {
              logger.error(err);
              return next(err);
            }
            // Store generated hash to actual users object
            user['password'] = hash;

            var inputForToken = {};
            inputForToken['_id'] = user._id;
            inputForToken['email'] = user.email;
            inputForToken['password'] = user.password;
            inputForToken['timestamp'] = new Date().getTime();

            var token = jwt.encode(inputForToken, config.secret);
            var UUID = uuidV1();

            db['users'].findOneAndUpdate({email: req.params.email}, {$set: user}, function(err, updatedUser) {
              mailer.send('finish-forgot-password', user, user.email, function sendMailCallback(e, b) {
                if (e) {
                  logger.error('Finish Forgot Password.');
                  logger.info(user);
                  logger.error(e);
                } else {
                  logger.info(user.email + ' sent for new password successfully');
                }
              });
              res.status(200).json({success: true,message : 'For new password verify your registed email.'});
            });
          });
        });
      }
    });
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
