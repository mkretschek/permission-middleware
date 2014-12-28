'use strict';
/* jshint latedef:false */




function has(permission) {
  if (typeof permission === 'function') {
    return permission;
  }

  if (permission && permission.test) {
    return function (req) {
      return permission.test(req);
    };
  }

  if (Array.isArray(permission)) {
    return all(permission);
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

  return function (req) {
    var len, i;

    for (i = 0, len = tests.length; i < len; i += 1) {
      if (!tests[i](req)) {
        return false;
      }
    }

    return true;
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

  return function (req) {
    var len, i;

    for (i = 0, len = tests.length; i < len; i += 1) {
      if (tests[i](req)) {
        return true;
      }
    }

    return false;
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