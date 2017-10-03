/**
* @name lib/authentication.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
* @help http://devdactic.com/restful-api-user-authentication-1/
* @version 0.0.1
*/
(function(){
  'use strict';
  var jwt = require('jwt-simple');
  var db = require('./db');
  var config = require('../config');
  var logger = require('./logger')(__filename);

  module.exports = function(app, passport) {
    // Validate each request for authorized token
    // If token is present than check for valid user from users table
    app.use('/', passport.authenticate('jwt', { session: false}), function(req, res, next) {
      logger.info("Requsting resource - " + req.url + " for " + req.method);
      var token = getToken(req.headers);
      if (token) {
        var decoded = jwt.decode(token, config.secret);
        db['users'].findOne({
          email: decoded.email
        }, function(err, user) {
            if (err) {
              throw err;
            }

            if (!user) {
              return res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
            } else {
              next();
            }
        });
      } else {
        return res.status(401).send({success: false, msg: 'No token provided.'});
      }
    });
  };

  // get actual token from req header, It simply remove JWT from req token
  var getToken = function (headers) {
    if (headers && headers.authorization) {
      var parted = headers.authorization.split(' ');
      if (parted.length === 2) {
        return parted[1];
      } else {
        return null;
      }
    } else {
      return null;
    }
  };
})();
