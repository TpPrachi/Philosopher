/**
* @name routes/users/logout.js
* @author Jaydipsinh Vaghela <jaydip.vaghela@gmail.com>
*
* @version 0.0.1
*/

(function(){
  'use strict'
  var express = require('express');
  var router = express.Router();
  var db = require('../../lib/db');
  var logger = require('../../lib/logger')(__filename);


  router.delete('/', function(req, res, next) {
    db['tokenmapped'].findOneAndDelete({'token': req.headers['authorization']}, function(err, deleted) {
      if(err) {
        res.status(501).send({success:false, message:"Error while removing mapping from token mapped collection."});
      }
      res.status(201).send({success:true, message:"User logout successfully."});
    });
  });

  module.exports = router;
})();
