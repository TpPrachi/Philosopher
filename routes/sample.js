
/**
* @name routes/sample.js
* @author Prachi Thakkar <prachi281194@gmail.com>
*
* @version 0.0.0
*/

(function(){
  'use strict'
  var express = require('express');
  var router = express.Router();
  var TP = require('../lib/routeBuilder');

  /* GET API for ALL records from collection. */
  router.get('/', function(req, res, next) {
    TP.getAll('sample', {}).then(function(success) {
      res.status(201).json(success);
    }, function(err) {
      // Need to change here
      res.status(400).json(err);
    });
  });

  /* GET API for ALL records from collection. */
  router.get('/:id', function(req, res, next) {
    TP.getOne('sample', {_id: ''}).then(function(success) {
      res.status(201).json(success);
    }, function(err) {
      // Need to change here
      res.status(400).json(err);
    });
  });


  module.exports = router;

})();
