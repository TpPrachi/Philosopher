var joi = require('joi');

var requiredIdSchema = joi.string().min(24).max(24).required();
var idSchema = joi.string().min(24).max(24);
var requiredString = joi.string().min(2).max(50).required();
var string = joi.string().min(2).max(50);
var smallString = joi.string().max(50).required();
var bigString = joi.string().min(2).max(200);
//Start - Lokesh Boran : QC3-5095
var mediumLargeString = joi.string().allow('').min(2).max(300);
//End - Lokesh Boran : QC3-5095
var rBigString = joi.string().min(2).max(200).required();
var extraLargeString = joi.string().min(2).max(5000);
var rExtraLargeString = joi.string().min(2).max(5000).required();
var requiredBool = joi.boolean().required();
var bool = joi.boolean();
var requiredNumber = joi.number().min(1).max(999999999).required();
var requiredNumberStartFrom0 = joi.number().min(0).max(999999999).required();
var number = joi.number().min(0).max(999999999);
var object = function object(obj) {
  return joi.object().keys(obj);
}
var array = function array(ary) {
  return joi.array().items(ary).min(1);
}
var optionalArray = function array(ary) {
  return joi.array().items(ary);
}
var date = joi.date();
var optionaldate = joi.date().allow(null);
var requiredDate = joi.date().required();
var rArrayOfString = joi.array().items(joi.string()).required();
var arrayOfString = joi.array().items(joi.string());
var anyArray = joi.array();
var any = joi.any();

module.exports = {
  rId: requiredIdSchema,
  id: idSchema,
  rString: requiredString,
  string: string,
  //Start - Lokesh Boran : QC3-5095
  mediumLargeString: mediumLargeString,
  //End - Lokesh Boran : QC3-5095
  rBool: requiredBool,
  bool: bool,
  rNumber: requiredNumber,
  rNumber0: requiredNumberStartFrom0,
  number: number,
  object: object,
  required: joi.required.bind(joi),
  forbidden: joi.forbidden.bind(joi),
  array: array,
  date: date,
  rDate: requiredDate,
  stringArray: arrayOfString,
  any: any,
  optionalArray: optionalArray,
  anyArray : anyArray,
  optionaldate: optionaldate,
  bigString: bigString,
  rBigString: rBigString,
  extraLargeString: extraLargeString,
  rExtraLargeString: rExtraLargeString,
  rSmallString : smallString
}
