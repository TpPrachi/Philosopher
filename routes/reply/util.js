'use strict';
var db = require('../../lib/db');
var logger = require('../../lib/logger');
var _ = require('lodash');

// Reply is deleted so need to descrement the counter of philosophies reply count
_replyUpdated = function(philosophyId, isAdded) {
    db['philosophies'].findOneAndUpdate({_id: db.ObjectID(philosophyId)}, {$inc: { replyCount: (isAdded ? 1 : -1)}});
};

module.exports = {
  replyUpdated: _replyUpdated
};
