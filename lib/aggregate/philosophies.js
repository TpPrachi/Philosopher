'use strict';
var db = require('../db');
var projections = require('../projections/philosophies');

var getPhilosophies = function(req, flag){
  var data = [];
  var user = {
    from: "usersmapped",
    foreignField: "userId",
    localField: 'userId',
    as: "users"
  };

  if (flag == 'philosophy') {
    data.push({
      "$match": req.filter
    },{
      $lookup: user
    });
  }
  if (flag == 'allPhilosophies') {
    data.push({
      "$match": req.filter
    },{
      $lookup: user
    },{
      $sort: {'CreatedDate':-1}
    },{
      $skip:req.options['skip']
    },{
      $limit:req.options['limit']
    },{
      $project:projections
    });
  }
  return data;
};

var getPhilosophyOperations = function(req,select){
  var data = [{
    "$match": req.filter
  },{
    "$unwind": (req.params.operation == 1 ? "$like.info" : (req.params.operation == 2 ? "$dislike.info" : (req.params.operation == 3 ? "$objections.info" : "")))
  },{
    $lookup: {
      from: "usersmapped",
      foreignField: "userId",
      localField: (req.params.operation == 1 ? "like.info._id" : (req.params.operation == 2 ? "dislike.info._id" : (req.params.operation == 3 ? "objections.info._id" : ""))),
      as: "users"
    }
  },{
    $project: select
  },{
    $sort: {username: 1}
  }];
  return data;
};

module.exports = {
  getPhilosophies: getPhilosophies,
  getPhilosophyOperations: getPhilosophyOperations
};
