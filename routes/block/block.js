
/**
* @name routes/block/block.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
*
* @version 0.0.1
*/

(function() {
  'use strict'
  var express = require('express');
  var router = express.Router();
  var db = require('../../lib/db');
  var validate = require('../../lib/validator');
  var schema = require('./schema');
  var logger = require('../../lib/logger')(__filename);
  var _ = require('lodash');

  // Post api for block user based on request body information
  router.post('/', validate(schema), function(req, res, next) {
    req.body["blockTo"] = db.ObjectID(req.body.blockTo);
    req.body["UpdatedDate"] = new Date();
    req.body["CreatedDate"] = new Date();

    // check if user already blocked or not. If user blocked then reply 501 with already blocked info.
    db['block'].findOne({'userId': db.ObjectID(req.body.userId), 'blockTo': db.ObjectID(req.body.blockTo)}, {blockTo: 1}, function(err, blocked){
      if(blocked) { // If found data then user already block else go with normal flow
        logger.info("User already blocked.");
        res.status(501).send({"success":false, "message": "User already blocked."});
      } else {
        db['block'].insert(req.body, function(err, d) {
          if(err) {
            logger.error("Error while removing notification :: " + err);
            res.status(501).send({"success":false, "message":err});
          }
          res.status(200).send({"success":true, "message":"User blocked successfully."});
        });
      }
    });
  });

  // For unblock user based on id
  router.delete('/:id' ,function(req, res, next) {
    db['block'].findOneAndDelete({blockTo: db.ObjectID(req.params.id), userId: db.ObjectID(req.body.userId)}, function(err, d) {
      if(err) {
        logger.error("Error while unblock user :: " + err);
        res.status(501).send({"success":false, "message":err});
      }
      if(d.value == null) {
        logger.error("Please provide valid information for unblock user.");
        res.status(501).send({"success":false, "message":"Please provide valid information for unblock user."});
      } else {
        res.status(200).send({"success":true, "message":"User unblocked successfully."});
      }
    });
  });

  module.exports = router;
})();
