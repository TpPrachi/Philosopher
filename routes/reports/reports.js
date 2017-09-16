// here need to write common template. which we are write in almost every file - Jaydip
(function(){
  'use strict'
  var express = require('express');
  var router = express.Router();
  var db = require('../../lib/db');
  var logger = require('../../lib/logger')(__filename);
  var _ = require('lodash'); // Lodash use nathi karyu to inject kem karyu??? - Jaydip

  router.post('/:reportUserId/:reportId', function(req, res, next) {
    //http://localhost:3009/reports/59b69d6133a5953c0d62a40e/59ba98e236230d31061ade96
    //Prachi : Local DB : philosophers
    //reportUserId :"_id" : ObjectId("59b69d6133a5953c0d62a40e"), "email" : "jaydip.vaghela@gmail.com"
    //reportId : Sexual Content

    // Here need to findOne - Me tamne 2 thi 3 var kidhu 6e aaa, Habit aavi padso to kem chalse
    // find ma kevu thase aee badha record find karva jase pa6i aene toArray ma convert pan karse
    // to khoto load pade, to be carefull at your first day... Jaydip
    db['reportUser'].find({_id:db.ObjectID(req.params.reportId)}).toArray(function(err, reportData) {
      var postReport = {};
      console.log(reportData); // console.log kem use karyu??? - jaydip
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
          res.status(201).send({"success":true, "message":"User reported succefully."});
        });
      } else {
        // Why you return 400 - i think it should be 500 series. - Jaydip
        res.status(400).send({"success":false, "message": "Please provide valid information for report."});
      }
    });
  });

  module.exports = router;
})();
