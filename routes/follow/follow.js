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
  var q= require('q');
  var logger = require('../../lib/logger');
  var notify = require('../../lib/notification');

  /* GET API for ALL records from collection. */
  router.get('/', function(req, res, next) {

  });

  /* POST API for insert record in collection. */
  router.post('/', function(req, res, next) {
    var post = req.body;
    post["CreatedDate"] = new Date();
    db['follow'].insert(post, function(err, d) {
      if(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      }

      var prepareObject = {};
      prepareObject["notifyTo"] = db.ObjectID(post['followedTo']);
      prepareObject["notifyBy"] = db.ObjectID(post['following']);
      prepareObject["notifyType"] = "follow";

      notify.addNotification(prepareObject).then(function(data){
        res.status(201).send({"success":true, "message":data});
      }, function(err) {
        logger.error(err);
        res.status(501).send({"success":false, "message":err});
      });
    });
  });

  /* PATCH API for update entity values. */
  router.patch('/:id', function(req, res, next) {
    var patch = req.body;
    patch["UpdatedDate"] = new Date();
    db['follow'].findOneAndUpdate({_id: db.ObjectID(req.params.id)}, {$set: patch}, {returnOriginal: false}, function(err, d) {
      if(err) {
        res.status(501).send({"success":false, "message":err});
      }
      res.status(200).send({"success":true, "message":"Done"});
    });

  });

  module.exports = router;

})();
