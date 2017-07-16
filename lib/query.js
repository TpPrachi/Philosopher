(function(){
  'use strict';
  var _ = require('lodash');
  var logger = require('./logger');
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
