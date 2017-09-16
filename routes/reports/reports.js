/**
* @name routes/reports/reports.js
* @author Prachi Thakkar <prachi@gmail.com>
*
* @version 0.0.0
*/
(function(){
  'use strict'
  var express = require('express');
  var router = express.Router();
  var db = require('../../lib/db');
  var logger = require('../../lib/logger')(__filename);

  router.post('/:reportUserId/:reportId', function(req, res, next) {
    db['reportUser'].findOne({_id:db.ObjectID(req.params.reportId)}, function(err, reportData) {
      var postReport = {};
      if (reportData.length > 0) {
        postReport['reportedUserId'] = db.ObjectID(req.params.reportUserId); //User against whom I have to report
        postReport['reportId'] = db.ObjectID(req.params.reportId); //report user collection : which report content user have to report(collection : reportUser get that id)
        postReport['userId'] = db.ObjectID(req.body.userId); //My Id
        postReport["createdDate"] = new Date();
        db['reports'].insert(postReport, function(err, report) {
          if(err) {
            logger.error(err);
            res.status(501).send({"success":false, "message":err});
          }
          res.status(201).send({"success":true, "message":"User reported succefully."});
        });
      } else {
        res.status(500).send({"success":false, "message": "Please provide valid information for report."});
      }
    });
  });

  module.exports = router;
})();
