'use strict';
var db = require('../../lib/db');
// Reply is either added or removed there for take action based on flag isAdded
var _updateReplyCount = function(philosophyId, isAdded) {
    db['philosophies'].findOneAndUpdate({_id: db.ObjectID(philosophyId)}, {$inc: { replyCount: (isAdded ? 1 : -1)}});
};

module.exports = {
  updateReplyCount: _updateReplyCount
};
