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
  var query = require('../../lib/query');

  /* GET API for ALL records from collection. */
  router.get('/', query.filter, function(req, res, next) {
    var allUsers = [];
    //req.filter, req.options.select || projections || {}, req.options -- error
    db['users'].find().toArray(function(err, data) {
      if(err){
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      // Remove password fields from return object
      _.forEach(data, function(user) {
        user = _.omit(user,'password','tempPassword');
        allUsers.push(user);
      });
      res.status(200).json(allUsers);
    });
  });

  /* GET API for selected record from collection. */
  router.get('/:id', function(req, res, next) {
    db['users'].find({_id: db.ObjectID(req.params.id)}).toArray(function(err, data) {
      // Remove password fields from return object
        data[0] = _.omit(data[0],'password','tempPassword');
      if(err){
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).json(data);
    });
  });


  /* PATCH API for update entity values. */
  router.patch('/:id', validate(softSchema) ,function(req, res, next) {
    var patch = req.body;
    patch["UpdatedDate"] = new Date();

    var checkValidityForFullname = true;
    var checkValidityForEmail = true;

    db['users'].find({_id: db.ObjectID(req.params.id)}).toArray(function(err, data) {

      if (data && data[0] && data[0].fullname) {
        if (patch && patch.fullname && patch.fullname ===  data[0].fullname) {
          checkValidityForFullname = false;
          res.status(501).send({"success":false, "message": "Patching the same fullname, Please provide valid data for perform operation."});
        }else {
          checkValidityForFullname = true;
        }
      }

      if (data && data[0] && data[0].email) {
        if (patch && patch.email && patch.email ===  data[0].email) {
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
      res.status(200).json(data);
    });

    // Need to change here

  });

  module.exports = router;
})();
