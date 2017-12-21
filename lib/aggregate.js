/**
* @name routes/groups/groups.js
* @author Prachi Thakkar <prachi281194@gmail.com>
*
* @version 0.0.0
*/
'use strict';
var _ = require('lodash');
var getQuery = function(req) {
  var data = [];
  if (req.filter) {
    data.push({
      "$match": req.filter
    });
  }
  if (req.unwind) {
    data.push({
      "$unwind":req.unwind
    });
  }
  data.push({
    $lookup: {
      from: "usersmapped",
      foreignField: "userId",
      localField: req.localField ? req.localField : 'userId',
      as: "users"
    }
  });
  if (req.extraLookup) { // Done
    _.forEach(req.extraLookup, function(lookup){
      data.push({
        $lookup: lookup
      });
    });
  }
  if (req.notifyTo) {
    data.push({
      $lookup: req.notifyTo
    });
  }
  if (req.sort) {
    data.push({
      $sort: req.sort
    });
  }
  if (req.options) {
    data.push({
      $skip:req.options['skip']
    },{
      $limit:req.options['limit']
    });
  }
  if (req.projections) {
    data.push({
      $project: req.projections
    });
  }
  return data;
};

var getReverseQuery = function(req) {
  var data = [];
  data.push({
    $lookup: {
      from: "usersmapped",
      foreignField: "userId",
      localField: req.localField ? req.localField : 'userId',
      as: "users"
    }
  });
  if (req.filter) {
    data.push({
      "$match": req.filter
    });
  }
  if (req.sort) {
    data.push({
      $sort: req.sort
    });
  }
  if (req.options) {
    data.push({
      $skip:req.options['skip']
    },{
      $limit:req.options['limit']
    });
  }
  return data;
};


module.exports = {
  getQuery: getQuery,
  getReverseQuery: getReverseQuery
};
