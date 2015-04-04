'use strict';
/* jshint latedef:false */


var async = require('async');


function has(permission) {
  if (arguments.length > 1) {
    permission = Array.prototype.slice.call(arguments);
  }

  if (Array.isArray(permission)) {
    return all(permission);
  }

  if (typeof permission === 'function') {
    return permission;
  }

  if (permission && permission.test) {
    return function (req, done) {
      return permission.test(req, done);
    };
  }

  throw(new Error('Invalid permission'));
}





/**
 * Creates a test function that tests if a request has **all** the given
 * permissions.
 *
 * @param {...(function(req)|Permission|Array)} permission Permission to
 *  check against.
 *
 * @returns {function(req)} A function that checks if the given request object
 *  passes at least one of the permissions.
 */
function all(permission) {
  var permissions = arguments.length === 1 && Array.isArray(permission) ?
    permission : Array.prototype.slice.call(arguments);

  var tests = _getTestArray(permissions);


  return function (req, done) {
    function runner(test, cb) {
      test(req, cb);
    }

    async.all(tests, runner, done);
  };
}



/**
 * Creates a test function that tests if a request has at least one of the
 * given permissions.
 *
 * @param {...(function(req)|Permission|Array)} permission Permission to
 *  check against.
 *
 * @returns {function(req)} A function that checks if the given request object
 *  passes at least one of the permissions.
 */
function any(permission) {
  var permissions = arguments.length === 1 && Array.isArray(permission) ?
    permission : Array.prototype.slice.call(arguments);

  var tests = _getTestArray(permissions);

  return function (req, done) {
    function runner(test, cb) {
      test(req, cb);
    }

    async.any(tests, runner, done);
  };
}






/**
 * Converts the given permissions into an array of test functions
 * @param {Array} permissions
 * @returns {Array}
 * @private
 */
function _getTestArray(permissions) {
  var len, i;

  var tests = [];
  var permission;

  for (i = 0, len = permissions.length; i < len; i += 1) {
    permission = permissions[i];

    if (Array.isArray(permission)) {
      tests.push(all(permission));
      continue;
    }

    tests.push(has(permission));
  }

  return tests;
}




exports.has = has;
exports.all = all;
exports.any = any;