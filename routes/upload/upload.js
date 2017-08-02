(function(){
  'use strict'

var express = require('express');
var router = express.Router();
var fs = require('fs-extra');
var logger = require('../../lib/logger');
var Jimp = require('jimp');
var db = require('../../lib/db');

router.post('/profilePhoto', function(req, res, next) {
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    logger.info("Uploading: " + filename);
    var filename = (new Date()).getTime() + '-' + filename;
    filename = decodeURI(filename);

    var patch = {
      profilePhoto : filename
    }

    db['users'].findOneAndUpdate({_id: db.ObjectID(req.body.UID)}, {$set: patch}, function(err, data) {
      db['usersmapped'].findOneAndUpdate({userId: db.ObjectID(req.body.UID)}, {$set: patch}, function(err, data) {
        if (err) {
          logger.error(err);
        }
        var dir = process.env.FILE_STORE + '/' + req.body.UID ;
        if (!fs.existsSync(dir)){
          fs.mkdirSync(dir);
        }
        var profilePhoto = dir + '/profilePhoto';
        if (!fs.existsSync(profilePhoto)){
          fs.mkdirSync(profilePhoto);
        }
        var resizedImage = profilePhoto + '/resizedImage';
        if (!fs.existsSync(resizedImage)){
          fs.mkdirSync(resizedImage);
        }
        var fstream = fs.createWriteStream(profilePhoto + '/' + filename);
        var fstream1 = fs.createWriteStream(resizedImage + '/' + filename);
        file.pipe(fstream);
        file.pipe(fstream1);
        fstream.on('close', function () {
          fstream1.on('close', function () {
            Jimp.read(resizedImage + '/' + filename, function (err, file) {
              logger.log("err :: " + err)
              if (err) throw err;
              file.resize(256, 256)
              .quality(50)
              .write(resizedImage + '/' + filename);
            });
            res.status(201).json({file: filename});
          });
        });
      });
    });
  });
});

router.post('/philosophyPhoto/', function(req, res, next) {
  req.pipe(req.busboy);
  var arr = [];
  req.busboy.on('file', function (fieldname, file, filename) {
    logger.info("Uploading: " + filename);
    // var ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    //
    // if(ext === 'jpg' || ext === 'png' || ext === 'gif'){
    //
    // }
    var filename = (new Date()).getTime() + '-' + filename;
    filename = decodeURI(filename);
    //Path where file will be uploaded
    var dir = process.env.FILE_STORE + '/' + req.body.UID ;
    arr.push(filename);
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
    var profilePhoto = dir + '/philosophyPhoto';
    if (!fs.existsSync(profilePhoto)){
      fs.mkdirSync(profilePhoto);
    }
    var fstream = fs.createWriteStream(dir + '/' + filename);
    file.pipe(fstream);
    fstream.on('close', function () {

      Jimp.read(dir + '/' + filename, function (err, file) {
        logger.log("err :: " + err)
        if (err) throw err;
        file.resize(256, 256)
        .quality(50)
        .write(profilePhoto + '/' + filename);
      });
    });
  });

  req.busboy.on('finish', function (fieldname, file, filename) {
    res.status(201).json({file: arr});
  });
});

router.get('/:file', function(req, res, next) {
  if(!req.params.file){
    res.status(422).json({'message' : 'file not provided'})
    return;
  }

  var filename = process.env.FILE_STORE  + '/' + req.body.UID + '/profilePhoto/'+ req.params.file;

  filename = decodeURI(filename);
  if (!fs.existsSync(filename)){
    res.status(404).json({'message' : 'file not found'})
    return;
  }
  var fileToShow = filename.substring(filename.lastIndexOf('/') + 15 , filename.length);
  res.download(filename , fileToShow)
});

module.exports = router;

})();
