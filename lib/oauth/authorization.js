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
        user.tempPassword = user.password;
        user.communityCount = 0;
        if(!_.isUndefined(user) && (!_.isUndefined(user.password) && user.password != '') && (!_.isUndefined(user.email) && user.email != '') && (!_.isUndefined(user.fullname) && user.fullname != '')) {
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
                db['usersmapped'].insert({userId:data.insertedIds[0], fullname:user.fullname, email:user.email});

                mailer.send('sign-up', user, user.email, function sendMailCallback(e, b) {
                  if (e) {
                    logger.error('User created successfully.');
                    logger.info(user);
                    logger.error(e);
                  } else {
                    logger.info(user.email + ' got registered successfully');
                  }
                });
                delete user.password;
                delete user.tempPassword;
                res.status(200).send({"success":true, "message":"User created successfully.", user: user});
              });
            });
          });
        } else {
          logger.error("Username or Password is not provided");
          res.status(500).send({"success":false, "message":"Please provide password."});
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
        email: req.body.email,
        tempPassword: req.body.password
      }, function(err, user) {
        if (err) {
          logger.error(err);
          res.status(500).send({success: false, message: 'Authentication failed while finding user information.'});
        }

        if (!user) {
          res.send({success: false, message: 'Authentication failed. User not found.'});
        } else {
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
              // User id is not found in mapped table so procede and generate new token
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
                          delete user.tempPassword; // remove password from information
                          delete user.password;

                          mailer.send('login', user, user.email, function sendMailCallback(e, b) {
                            if (e) {
                              logger.error('Login successfully.');
                              logger.info(user);
                              logger.error(e);
                            } else {
                              logger.info(user.email.underline + ' got registered successfully');
                            }
                          });

                          res.status(200).json({success: true, token: UUID, user: user});
                        } else {
                          logger.error('Authentication failed. Wrong password.');
                          res.status(200).send({success: false, message: 'Authentication failed. Wrong password.'});
                        }
                      });
                    });
                  });
            } else {
              // User already logined so please provide data from mapped collection.
              // return the information including UUID mappend with JWT token
              delete user.tempPassword; // remove password from information
              delete user.password;
              res.send({success: true, token: mappedUser.uuid, user: user});
            }
          });
        }
      });
    } else {
      res.status(500).send({success: false, message: 'Please provide valid email or password.'});
    }

  });

  // Need to create api for email varification
  // Verification mail

  router.patch('/:userId/forgot-password', function (req,res,next) {
    //Email New Confirm Password
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
          db['users'].findOneAndUpdate({_id: db.ObjectID(req.params.userId), email: req.body.email}, {$set: {
            password: hashNewPassword,
            tempPassword: req.body.newPassword,
            modifiedDate: new Date()}
          }, {returnOriginal: false}, function(err, user) {
            if (user.value) {
              logger.info('Forgot Password successfully.');
              //res.status(200).send({success: true, message: 'Change Password successfully'});

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

                  mailer.send('finish-forgot-password', user.value, user.value.email, function sendMailCallback(e, b) {
                    if (e) {
                      logger.error('Finish Forgot Password.');
                      logger.info(user);
                      logger.error(e);
                    } else {
                      logger.info(user.value.email.underline + ' got registered successfully');
                    }
                  });
                  delete user.value.password;
                  delete user.value.tempPassword;
                  res.status(200).json({success: true, token: UUID, user: user.value});
                });
                // return the information including UUID mappend with JWT token
                //res.json({success: true, token: 'JWT ' + token});
              } else {
                logger.info('Authentication failed. Wrong password.');
                res.status(200).send({success: false, message: 'Authentication failed. Wrong password.'});
              }
            }else {
              logger.error("Provided email id is invalid.");
              res.status(400).send({"success":false, "message":"Provided email id is invalid."});
            }
          });
        });
      });
    }else {
      logger.error("New Password & Confirm Password must be same.");
      res.status(400).send({"success":false, "message":"New Password & Confirm Password must be same."});
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
