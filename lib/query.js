(function(){
  'use strict';
  var _ = require('lodash');
  var logger = require('./logger')(__filename);
  var _filter = function(req, res, next) {

    try{

      // Apply paging given as per query string else return default limit
      var pageSize = parseInt(req.query.pagesize || 5);
      var page = parseInt(req.query.page || 1);
      var options = {
        pageSize: pageSize,
        page: page,
        skip: pageSize * (page - 1),
        limit: pageSize,
      };

      // Here you can provide projectino to query data.
      if(req.query.select) {
        options.select = {};
        _.forEach(req.query.select.split(','), function forEachCallback(field) {
          options.select[field] = 1;
        });
      }

      req.options = options;

      // Here you can provide filter over collection for search criteria.
      req.filter = {};
      if(req.query.q) { // Check is there need to build query optimization?
        var queryBuild = [];
        _.forEach(req.query.q, function(value, key) { // loop through each parameter for prepare query
          var v = value.split('|');
          if(v.length >= 2 ) {
            // Need to write specail case for each filter key like $in,$text and etc

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

        if(queryBuild.length > 0) {
          req.filter = {
              $and: queryBuild
              //$or: queryBuild
          };
        }
      }
      logger.info("req.filter :: " + JSON.stringify(req.filter));


      next();
    } catch(e){
      logger.error(e);
      res.status(501).send({"success":false, "message":e});
    }

  }

  module.exports = {
    filter: _filter
  };

})();
