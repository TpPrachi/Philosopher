var types = require('../../lib/validator/types');
var array = types.array;
var date = types.date;
var rString =  types.rString;
var string = types.string;
var id = types.id;
var any = types.any;
var anyArray = types.anyArray;

var schema = {
 adminUserId: id.label('Admin User Id'),
 CreatedDate: date.label('Created Date'),
 UpdatedDate: date.label('Updated Date'),
 groupName: rString.label('Group Name'),
 groupMembers: anyArray.label('Array Of Group Members'),
 profilePhoto: string.label('Profile Photo of Group')
}

module.exports = schema;
