var types = require('../../lib/validator/types');
var rString =  types.rString;
var array = types.array;
var rNumber =  types.rNumber;
var date = types.date;
var bool = types.bool;
var rId = types.rId;
var rExtraLargeString = types.rExtraLargeString;
var object = types.object.bind(types);


var schema = {
  philosophy: rExtraLargeString.label('Philosophy'),
  philosophyType: rString.label('Philosophy Type'),
  trends: array(object({
  _id: rId.label('Trend Id'),
  trendName : rString.label('Trend Name'),
  trendType : rString.label('Trend Type'),
  totalCountOfTrend : rNumber.label('Total Count of Trend'),
  isDeleted : bool.label('Is Deleted')
  })).required().label('Questions array of object')
  // pic reference array
  // Video reference array
}

module.exports = schema;
