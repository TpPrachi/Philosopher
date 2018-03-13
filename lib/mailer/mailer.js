'use strict'
/**
* @name mailer
* @author Prachi Thakkar <prachi281194@gmail.com>
*
* @version 0.0.0
*/

var EmailTemplate = require('email-templates').EmailTemplate;
var path = require('path');
var logger = require('../logger')(__filename);
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var _ = require('lodash');
var db = require('../db');
var config = require('../../config');

var transporter = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
        user: config.mail.user,
        pass: config.mail.pass
    }
});

logger.info('host: ' + config.mail.host);
logger.info('user: ' + config.mail.user);
logger.info('pass: ' + config.mail.pass);
logger.info('from: ' + config.mail.from);
logger.info('port: ' + config.mail.port);

/*var transporter = nodemailer.createTransport(smtpTransport({
host: 'smtp.gmail.com',
port: 587,
auth: {
user: 'protsystems123',
pass: 'Prot@123'
}
}));*/

var transporter = nodemailer.createTransport(smtpTransport({
  host: config.mail.host,
  port: config.mail.port,
  auth: {
    user: config.mail.user,
    pass: config.mail.pass
  }
}));


/**
* Renders a template into string
*
* @param {string} - name of the template, Conventionally its name of the
*        folder, in it there must be two files html.hbs (Body) and text.hbs
*        (Subject).
*        REF: http://handlebarsjs.com/
* @param {Object} - Model to bind to the template
* @param {Function} - Standard Callback
* @return {Object} - Object with two properties, "text" and "html"
*
* @private
*/
function render(template,model,cb) {

  logger.info('Inside Render');

  var templateDir = path.join(__dirname, 'templates', template);

  var newsletter = new EmailTemplate(templateDir);
  newsletter.render(model, function renderCallback(err, results) {
    if(cb) {
      if(err) {
        logger.error('Failed rendering templates');
      }
      cb(err,results);
    }
  });

}

/**
* Sends the email
*
* @param  {String} - Email address of the recipient
* @param  {Object} - Object with two params, html and text.
* @param  {Function} - Standard Callback
* @return {Object} - Status.
*
* @private
*/
function sendmail(to,content,fileAttachments,cb) {
  //this is used for appAccessConfig email link

  logger.info('Inside Sendmail');
  logger.info('Send To :: ' + to);

  transporter.sendMail({
    //from: config.mail.from,  //do-not-reply@e.productivet.com
    to: to,
    subject: content.text,
    html: content.html,
    attachments: fileAttachments,
    priority: 'high'
  },function sendMailCallback(err,d){

    if(err){
      logger.error(err);
    }
    if(cb){
      logger.info('Function (CB): sendMailCallback - Success');
      cb(err,d)
    }
  });
}

/**
* Renders template and sends email to given recipient
*
* @param {string} - name of the template, Conventionally its name of the
*        folder, in it there must be two files html.hbs (Body) and text.hbs
*        (Subject).
*        REF: http://handlebarsjs.com/
* @param {Object} - Model to bind to the template
* @param {String} - Email address of the recipient
* @param {Function} - Standard Callback
* @return {Object} - Status
*
* @public
*/
function send (template,model,to,cb) {
  render(template,{ model: model },function renderCallback(e,templates) {
    sendmail(to, templates, [], cb);
  });
}



module.exports = {
  send: send
};
