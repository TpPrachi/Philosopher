'use strict';

(() => {
  const _ = require('lodash');

  trem(5000);

  function trem(n) {
    var res = rec(n,n-1);
    console.log(res);
  }

  function rec(n,k) {
      if(k <= 1) {
        n += 1;
        return n;
      } else {
        n = n+k
        return rec.bind(null, n, k-1);
      }
  }

})();

// For Big CSV file Conversion
//var Converter=require("csvtojson").Converter;
//var csvConverter=new Converter({constructResult:false}); // The parameter false will turn off final result construction. It can avoid huge memory consumption while parsing. The trade off is final result will not be populated to end_parsed event.
//var readStream=require("fs").createReadStream("inputData.csv");
//var writeStream=require("fs").createWriteStream("outpuData.json");
//readStream.pipe(csvConverter).pipe(writeStream);
