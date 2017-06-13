
/**
* @name routes/trends/trends.js
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

  });

  /* GET API for selected record from collection. */
  router.get('/:id', function(req, res, next) {

  });

  /* POST API for insert record in collection. */
  router.post('/', validate(schema), function(req, res, next) {
    var post = req.body;
    post["CreatedDate"] = new Date();
    db['trends'].insert(post, function(err, d) {
      if(err){
          res.status(501).send({"success":false, "message":err});
      }
      res.status(201).send({"success":true, "message":d.insertedIds});
    });
  });

  /* PATCH API for update entity values. */
  router.patch('/:id', validate(schema) ,function(req, res, next) {
    var patch = req.body;
    patch["UpdatedDate"] = new Date();
    db['trends'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: patch}, {returnOriginal: false}, function(err, d) {
      if(err){
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).send({"success":true, "message":"Done"});
    });

  });


  module.exports = router;

})();
