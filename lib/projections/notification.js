var projection = {
  "philosophyId":1,
  "CreatedDate":1,
  "isRead":1,
  "notifyTo":1,
  "notifyBy":1,
  "notifyType":1,
  "replyId":1,
  "isDeleted":1,
  "users.biolosophy":1,
  "users.userId":1,
  "users.fullname":1,
  "users.username":1,
  "users.profilePhoto":1,
  "philosophy.philosophy":1,
  "philosophy._id":1,
  "philosophy.userId":1,
  "philosophy.philosophyType":1,
  "replyUserCount":1,
  "notifyToUsers.biolosophy":1, // Changed by JD
  "notifyToUsers.userId":1,
  "notifyToUsers.fullname":1,
  "notifyToUsers.username":1,
  "notifyToUsers.profilePhoto":1,
  "reply.reply":1
};

module.exports = projection;
