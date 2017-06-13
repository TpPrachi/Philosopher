var types = require('../../lib/validator/types');
var string = types.string;
var rString =  types.rString;
var rNumber =  types.rNumber;
var string = types.number;
var array = types.array;
var date = types.date;
var bool = types.bool;
var rId = types.rId;
var rExtraLargeString = types.rExtraLargeString;
var extraLargeString = types.extraLargeString;
var object = types.object.bind(types);


var schema = {
  philosophy: extraLargeString.label('Philosophy'),
  philosophyType: string.label('Philosophy Type'),
  trends: array(object({
  _id: rId.label('Trend Id'),
  trendName : string.label('Trend Name'),
  trendType : string.label('Trend Type'),
  totalCountOfTrend : string.label('Total Count of Trend'),
  isDeleted : bool.label('Is Deleted')
  })).required().label('Questions array of object')
  // pic reference array
  // Video reference array
}

module.exports = schema;
