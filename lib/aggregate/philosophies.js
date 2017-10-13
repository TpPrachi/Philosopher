'use strict';
var db = require('../db');
var projections = require('../projections/philosophies');

var getPhilosophies = function(req, flag){
  var data = [];
  data.push({
    "$match": req.filter
  },{
    $lookup: {
      from: "usersmapped",
      foreignField: "userId",
      localField: 'userId',
      as: "users"
    }
  },{
    $sort: {'CreatedDate':-1}
  },{
    $skip:req.options['skip']
  },{
    $limit:req.options['limit']
  });
  if (req.params.operation) {
    data.push({
      "$unwind": (req.params.operation == 1 ? "$like.info" : (req.params.operation == 2 ? "$dislike.info" : (req.params.operation == 3 ? "$objections.info" : "")))
    },{
      $lookup: {
        from: "usersmapped",
        foreignField: "userId",
        localField: (req.params.operation == 1 ? "like.info._id" : (req.params.operation == 2 ? "dislike.info._id" : (req.params.operation == 3 ? "objections.info._id" : ""))),
        as: "users"
      }
    });
  }
  if (req.projections) {
    data.push({
      $project: req.projections
    });
  }
  if (req.select) {
    data.push({
      $project: req.select
    },{
      $sort: {username: 1}
    });
  }
  return data;
};


module.exports = {
  getPhilosophies: getPhilosophies
};
