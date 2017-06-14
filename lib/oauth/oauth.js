'use strict'
/**
* @name lib/oauth/oauth.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
*
* @version 0.0.0
*/
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var config = require('../../config'); // get db config file
var db = require('../db');
var logger = require('../logger');

module.exports = function(passport) {
  try {
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeader();
    opts.secretOrKey = config.secret;
    passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
      db['users'].findOne({id: jwt_payload.id}, function(err, user) {
        if (err) {
          logger.error("oauth :: " + err);
          return done(err, false);
        }
        if (user) {
          done(null, user);
        } else {
          done(null, false);
        }
      });
    }));
  } catch(e) {
    logger.error("oauth :: " + e);
  }
};
