(function(){
  'use strict'
  var express = require('express');
  var router = express.Router();
  var db = require('../../lib/db');
  var logger = require('../../lib/logger')(__filename);
  var _ = require('lodash');

  router.post('/:reportUserId/:reportId', function(req, res, next) {
    //http://localhost:3009/reports/59b69d6133a5953c0d62a40e/59ba98e236230d31061ade96
    //Prachi : Local DB : philosophers
    //reportUserId :"_id" : ObjectId("59b69d6133a5953c0d62a40e"), "email" : "jaydip.vaghela@gmail.com"
    //reportId : Sexual Content
    var postReport = {};
    db['reportUser'].find({_id:db.ObjectID(req.params.reportId)}).toArray(function(err, reportData) {
      console.log(reportData);
      if (reportData.length > 0) {
        postReport['reportedUserId'] = db.ObjectID(req.params.reportUserId); //Je User ne roport karvanu che
        postReport['reportId'] = db.ObjectID(req.params.reportId); //report user collection : which report
        postReport['userId'] = db.ObjectID(req.body.userId); //My Id
        postReport["createdDate"] = new Date();

        db['reports'].insert(postReport, function(err, report) {
          if(err) {
            logger.error(err);
            res.status(501).send({"success":false, "message":err});
          }
          res.status(201).send({"success":true, "message":"Users reported succefully."});
        });
      } else {
        res.status(400).send({"success":false, "message": "Provided reported data error."});
      }
    });
  });

  module.exports = router;
})();
