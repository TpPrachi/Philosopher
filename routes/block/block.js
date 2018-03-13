
/**
* @name routes/block/block.js
* @author Prachi Thakkar <prachi281194@gmail.com>
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

  // For block user based on id
  router.post('/', validate(schema), function(req, res, next) {
    req.body["blockTo"] = db.ObjectID(req.body.blockTo);
    req.body["UpdatedDate"] = new Date();
    req.body["CreatedDate"] = new Date();

    db['block'].insert(req.body, function(err, d) {
      if(err) {
        logger.error("Error while removing notification :: " + err);
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).send({"success":true, "message":"User blocked successfully."});
    });
  });

  // For unblock user based on id
  router.delete('/:id' ,function(req, res, next) {
    db['block'].findOneAndDelete({blockTo: db.ObjectID(req.params.id), userId: db.ObjectID(req.body.userId)}, function(err, d) {
      if(err) {
        logger.error("Error while removing notification :: " + err);
        res.status(501).send({"success":false, "message":err});
      }
      if(d.value == null) {
        logger.error("Please provide valid information for unblock user.");
        res.status(501).send({"success":false, "message":"Please provide valid information for unblock user."});
      } else {
        res.status(200).send({"success":true, "message":"Notification deleted successfully."});
      }
    });
  });

  module.exports = router;
})();
