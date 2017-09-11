'use strict';

(() => {
  const _ = require('lodash');

  trem(50000, function(d,n){
    console.log(d);
    console.log(n);
  });

  function trem(n, cb) {
    function rec(n,k, cb) {
        if(k <= 1) {
          n += 1;
          cb(n);
          return null;
        } else {
          return function(){
              n = n+k
              return rec.bind(this, n, k-1, cb);
          };
        }
    }

    return rec.bind(this, n, n-1, cb);
  }



})();

// For Big CSV file Conversion
//var Converter=require("csvtojson").Converter;
//var csvConverter=new Converter({constructResult:false}); // The parameter false will turn off final result construction. It can avoid huge memory consumption while parsing. The trade off is final result will not be populated to end_parsed event.
//var readStream=require("fs").createReadStream("inputData.csv");
//var writeStream=require("fs").createWriteStream("outpuData.json");
//readStream.pipe(csvConverter).pipe(writeStream);
