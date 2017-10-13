'use strict';

var getQuery = function(req){
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
  if (req.philosophyLookup) {
    data.push({
      $lookup: {
        from: "philosophies",
        foreignField: "_id",
        localField: 'philosophyId',
        as: "philosophy"
      }
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


module.exports = {
  getQuery: getQuery
};
