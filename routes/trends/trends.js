
/**
* @name routes/trends/trends.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
*
* @version 0.0.1
*/

(function(){
  'use strict'
  var express = require('express');
  var router = express.Router();
  var db = require('../../lib/db');
  var query = require('../../lib/query');
  var logger = require('../../lib/logger');

  /* GET API for ALL records from collection. */
  router.get('/', query.filter, function(req, res) {
    db['trends'].find(req.filter, req.options.select || {}, req.options).toArray(function(err, trends) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(trends);
    });
  });

  /* GET API for selected record from collection. */
  router.get('/:id', query.filter, function(req, res, next) {
    db['trends'].find({_id: db.ObjectID(req.params.id)}, req.options).toArray(function(err, data) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(201).json({"success":true, "data": data});
    });
  });

  module.exports = router;

})();
