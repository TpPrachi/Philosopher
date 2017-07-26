'use strict';
  var db = require('../../lib/db');

  // For remove philosophy reference after removing philosophy
  var _removeReference = function(philosophyId) {
    db['comment'].remove({pId: db.ObjectID(philosophyId)});
    db['reply'].remove({philosophyId: db.ObjectID(philosophyId)});
  };

module.exports = {
  removeReference: _removeReference
};
