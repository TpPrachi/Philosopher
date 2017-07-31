'use strict';
var db = require('../../lib/db');
var logger = require('../../lib/logger');
var _ = require('lodash');
// For remove philosophy reference after removing philosophy
var _removeReference = function(philosophyId) {
  db['comment'].remove({pId: db.ObjectID(philosophyId)});
  db['reply'].remove({philosophyId: db.ObjectID(philosophyId)});
};

var insertOrUpdateTrend = function(trend) {
  // Find with trend name if find then update count else insert new trend in trend table
  db['trends'].find({name:trend}).toArray(function(err, trend) {
    if(err) {
      logger.error("Error while finding trend in _trendMappingOnPost :: " + err);
    }

    if(trend.length > 0) { // if count is greater that 1 then go for increment count;
      trend[0].count = trend[0].count + 1;
      db['trends'].update({_id:trend[0]._id}, trend[0]);
    } else { // else insert new trend in table
      db['trends'].insert({name:trend,count:1});
    }
  });
};

var trendMapping = function(philosophy, philosophyId) {
  // split philosophy by # and loop through for inserting into trend table
  var trends = [];
  _.forEach(philosophy.split('#'), function(value, i) {
    if(i != 0 && !_.isUndefined(value) && value != '' && !_.isNull(value)) {
      var trend = value.indexOf(' ') !== -1 ? value.substring(0,value.indexOf(' ')) : value;
      trends.push(trend);
      insertOrUpdateTrend(trend);
    }
  });

  db['philosophies'].findOneAndUpdate({_id:db.ObjectID(philosophyId)}, {$set :{trends : trends}});
};

// For mapping #tag from philosophy text and mapped in to table
var _trendMappingOnPost = function(philosophy, philosophyId) {
  if(!_.isUndefined(philosophy) && philosophy != '') {
    trendMapping(philosophy, philosophyId);
  }
};

// For mapping #tag from philosophy text and mapped into trend table during patch api
var _trendMappingOnPatch = function(philosophy, philosophyId) {
  if(!_.isUndefined(philosophy) && philosophy != '') {
    db['philosophies'].findOne({_id: db.ObjectID(philosophyId)}, {trends:1}, function(err, philosophyTrend) {
      if(err) {
        logger.error("Trend Mapping On Patch :: " + err);
      }

      if(!_.isUndefined(philosophyTrend.trends) && _.size(philosophyTrend.trends) > 0) {

        // split philosophy by # and loop through for inserting into trend table
        var trends = [];
        _.forEach(philosophy.split('#'), function(value, i) {
          if(i != 0 && !_.isUndefined(value) && value != '' && !_.isNull(value)) {
            trends.push(value.indexOf(' ') !== -1 ? value.substring(0,value.indexOf(' ')) : value);
          }
        });

        _.forEach(_.difference(philosophyTrend.trends, trends), function(trend) {
            logger.info("Removed Trend :: " + trend);
            // Need to decrement of count and also remove from tredns of philosophy

        });

        _.forEach(_.difference(trends, philosophyTrend.trends), function(trend) {
            logger.info("New Added Trend :: " + trend);
            // Add
            insertOrUpdateTrend(trend);
        });


      } else {
        // Here if there is no trends in previous saved philosophy, So need to add all trends in collection
        trendMapping(philosophy, philosophyId);
      }
    });
  }
};

module.exports = {
  removeReference: _removeReference,
  trendMappingOnPost: _trendMappingOnPost,
  trendMappingOnPatch: _trendMappingOnPatch
};
