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
  var logger = require('../../lib/logger')(__filename);
  var _ = require('lodash');
  var query = require('../../lib/query');

  /* GET API for ALL records from collection. */
  router.get('/', query.filter, function(req, res, next) {
    var allUsers = [];
    db['users'].find(req.filter, req.options.select || {password:0,tempPassword:0}, req.options).toArray(function(err, users) {
      if(err){
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(users);
    });
  });

  /* GET API for selected record from collection. */
  router.get('/:id', function(req, res, next) {
    db['users'].find({_id: db.ObjectID(req.params.id)},{password:0,tempPassword:0}).toArray(function(err, users) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(users);
    });
  });


  /* PATCH API for update entity values. */
  router.patch('/:id', validate(softSchema) ,function(req, res, next) {
    var patch = req.body;
    patch["UpdatedDate"] = new Date();

    var checkValidityForFullname = true;
    var checkValidityForEmail = true;

    db['users'].find({_id: db.ObjectID(req.params.id)}).toArray(function(err, users) {

      if (users && users[0] && users[0].fullname) {
        if (patch && patch.fullname && patch.fullname ===  users[0].fullname) {
          checkValidityForFullname = false;
          res.status(501).send({"success":false, "message": "Patching the same fullname, Please provide valid data for perform operation."});
        }else {
          checkValidityForFullname = true;
        }
      }

      if (users && users[0] && users[0].email) {
        if (patch && patch.email && patch.email ===  users[0].email) {
          checkValidityForEmail = false;
          res.status(501).send({"success":false, "message": "Patching the same email, Please provide valid data for perform operation."});
        }else {
          checkValidityForEmail = true;
        }
      }

      // db['users'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: patch}, {returnOriginal: false}, function(err, data) {
      // db['usersmapped'].update({userId: db.ObjectID(req.params.id)}, {$set: patch}, {returnOriginal: false}, function(err, usersmappedData) {
      //
      //   if(err) {
      //     logger.error(err);
      //     res.status(501).send({"success":false, "message":err});
      //   }
      //   res.status(200).send({"success":true, "message":usersmappedData.value});
      // });
      //
      //   if(err) {
      //     logger.error(err);
      //     res.status(501).send({"success":false, "message":err});
      //   }
      //   res.status(200).send({"success":true, "message":data.value});
      // });

      // Remove password fields from return object
      if(err){
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(users);
    });

    // Need to change here

  });

  module.exports = router;
})();
