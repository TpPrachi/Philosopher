/**
* @name routes/follow/follow.js
* @author Prachi Thakkar <prachi281194@gmail.com>
*
* @version 0.0.0
*/

(function(){
  'use strict'
  var express = require('express');
  var router = express.Router();
  var db = require('../../lib/db');
  var logger = require('../../lib/logger')(__filename);
  var query = require('../../lib/query');
  var aggregation = require("../../lib/aggregate");

  /* GET API for ALL records from collection. */
  router.get('/:id/:key', query.filter, function(req, res) {

    // add new filter based on param for geting philosophy specific information
    req.filter['philosophyId'] = db.ObjectID(req.params.id);
    req.filter['pollAnswer'] = req.params.key;

    // Build aggregate object for get users details based on following information
    // var aggregate = [{
    //     "$match": req.filter
    //   },{
    //     $lookup: {
    //        from: "usersmapped",
    //        foreignField: "userId",
    //        localField: 'userId',
    //        as: "users"
    //     }
    //   },{
    //     $sort: {"users.username" : 1}
    //   }, {
    //     $skip: req.options.skip
    //   }, {
    //     $limit: req.options.limit
    //   }
    // ];
    req['sort'] = {"users.username" : 1};
    var aggregate = aggregation.getQuery(req);
    
    db['polls'].aggregate(aggregate, function(err, information) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(201).json({"success":true, "data":information});
    });
  });

  module.exports = router;
})();
