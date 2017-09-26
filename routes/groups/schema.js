var types = require('../../lib/validator/types');
var array = types.array;
var date = types.date;
var rString =  types.rString;
var id = types.id;
var any = types.any;
var anyArray = types.anyArray;

var schema = {
 adminUserId: id.label('Admin User Id'),
 CreatedDate: date.label('Created Date'),
 UpdatedDate: date.label('Updated Date'),
 groupName: rString.label('Group Name'),
 groupMembers: anyArray.label('Array Of Group Members')
}

module.exports = schema;
