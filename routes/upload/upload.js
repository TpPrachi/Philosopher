  'use strict'

var express = require('express');
var router = express.Router();
var fs = require('fs-extra');
var logger = require('../../lib/logger');

router.post('/', function(req, res, next) {
  console.log('tet--------------------------------------------------------------------');
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    logger.log("Uploading: " + filename);
    var filename = (new Date()).getTime() + '-' + filename;
    filename = decodeURI(filename);
    //Path where file will be uploaded
    var fstream = fs.createWriteStream(process.env.FILE_STORE + filename);

    file.pipe(fstream);

    fstream.on('close', function () {
      debug("Upload Finished of " + filename);
      res.status(201).json({file: filename});
    });
  });
});
