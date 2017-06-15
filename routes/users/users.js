
/**
* @name routes/users/users.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
*
* @version 0.0.0
*/

(function(){
  'use strict'
  var express = require('express');
  var router = express.Router();
  var db = require('../../lib/db');
  var validate = require('../../lib/validator');
  var schema = require('./schema');
  var softSchema = require('./softSchema');
  var Joi = require('joi');
  var logger = require('../../lib/logger')
  var _ = require('lodash');
  var retrct = ["password","tempPassword"]
  /* GET API for ALL records from collection. */
  router.get('/', function(req, res, next) {
    db['users'].find({}).toArray(function(err, data) {
      if(err){
          logger.error(err);
          res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(data);
    });
  });

  /* GET API for selected record from collection. */
  router.get('/:id', function(req, res, next) {
    db['users'].find({_id: db.ObjectID(req.params.id)}).toArray(function(err, data) {
      if(err){
          logger.error(err);
          res.status(501).send({"success":false, "message":err});
      }

      // code for retract password fields that does not need to send to client
      _.forEach(retrct, function(value) {
        delete data[0][value];
      });

      res.status(200).json(data);
    });
  });


  /* PATCH API for update entity values. */
  router.patch('/:id', validate(softSchema) ,function(req, res, next) {
    var patch = req.body;
    patch["UpdatedDate"] = new Date();
    db['users'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: patch}, {returnOriginal: false}, function(err, data) {
      if(err){
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).send({"success":true, "message":data.value});
    });

  });


  module.exports = router;

})();
