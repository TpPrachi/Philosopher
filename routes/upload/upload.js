(function(){
  'use strict'

var express = require('express');
var router = express.Router();
var fs = require('fs-extra');
var logger = require('../../lib/logger');

router.post('/', function(req, res, next) {
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    logger.log("Uploading: " + filename);
    var filename = (new Date()).getTime() + '-' + filename;
    filename = decodeURI(filename);
    //Path where file will be uploaded
    var fstream = fs.createWriteStream(process.env.FILE_STORE + '/profile/' + filename);
    file.pipe(fstream);
    fstream.on('close', function () {
      res.status(201).json({file: filename});
    });
  });
});

router.get('/:file', function(req, res, next) {
  if(!req.params.file){
    res.status(422).json({'message' : 'file not provided'})
    return;
  }

  var filename = process.env.FILE_STORE  + '/profile/' + req.params.file;

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
