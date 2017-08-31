(function(){
  'use strict';
  var _ = require('lodash');
  var logger = require('./logger')(__filename);
  var db = require('./db');
  var _filter = function(req, res, next) {
    try {
      // Apply paging given as per query string else return default limit
      var pageSize = parseInt(req.query.pagesize || 50);
      var page = parseInt(req.query.page || 1);
      var options = {
        pageSize: pageSize,
        page: page,
        skip: pageSize * (page - 1),
        limit: pageSize,
      };

      // Here you can provide projection to query data.
      if(req.query.select) {
        options.select = {};
        _.forEach(req.query.select.split(','), function forEachCallback(field) {
          options.select[field] = 1;
        });
      }
      req.options = options;

      // Here you can provide filter over collection for search criteria.
      req.filter = {};

      //q[philosophy]=$text|faltu
      //q[philosophy]=$in|jay,test,prachi
      if(req.query.q) { // Check is there need to build query optimization?
        var queryBuild = [];
        _.forEach(req.query.q, function(value, key) { // loop through each parameter for prepare query
          var v = value.split('|');
          if(v.length >= 2 ) {
            // Need to write specail case for each filter key like $in,$text and etc.
            if(v[0] == '$in') { // Here for search in array with $in query
              queryBuild.push({
                [key] : {$in : v[1].split(',')}
              });
            } else if(v[0] == '$text') { // Here for search plain text in field with regular expression
              queryBuild.push({
                [key] : { $regex: new RegExp(v[1].toLowerCase(), 'i') }
              });
            }
          }
        });

        // append final object for feltring data based on query string information
        if(queryBuild.length > 0) {
          req.filter = {
              $and: queryBuild
              //$or: queryBuild
          };
        }
      }

      // If request base url is for getting all philosophies then need to add some extra filter for getting only those records which user followed
      if(req.baseUrl == '/philosophies') {
        db['follow'].find({followingUser:db.ObjectID(req.body.UID)}, {followedUser:1}).toArray(function(err, followed) {
          if(err) {
            // If we find any error still allow to execute query
            logger.error("Error while getting following information of users for filtering.");
            next();
          }
          // Prepare array of all users that logged in user followed.
          req.filter['$or'] = _.reduce(followed, function(c, f) {
            c.push({'userId': db.ObjectID(f.followedUser)});
            return c;
          }, [{'userId': db.ObjectID(req.body.UID)}]);
          next();
        });
      } else {
        next();
      }
    } catch(e) {
      logger.error(e);
      res.status(501).send({"success":false, "message":e});
    }

  }

  module.exports = {
    filter: _filter
  };

})();
