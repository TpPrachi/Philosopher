
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
  var Joi = require('joi');

  /* GET API for ALL records from collection. */
  router.get('/', function(req, res, next) {
    db['users'].find({}).toArray(function(err, data) {
      if(err){
          res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(data);
    });
  });

  /* GET API for selected record from collection. */
  router.get('/:id', function(req, res, next) {

  });


  /* PATCH API for update entity values. */
  router.patch('/:id', validate(schema) ,function(req, res, next) {
    var patch = req.body;
    patch["UpdatedDate"] = new Date();
    db['users'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: patch}, {returnOriginal: false}, function(err, d) {
      if(err){
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).send({"success":true, "message":"Done"});
    });

  });


  module.exports = router;

})();
