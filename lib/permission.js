'use strict';
/* jshint latedef:false */


/**
 * Defines the `Permission` constructor used as a base for more specific
 * types of permissions and some helper methods for creating permission
 * checking functions.
 *
 * @module permission
 * @type {Function}
 * @constructor
 */




/**
 * Checks if the given code is already in use by another permission.
 * @param code {(String|Number)}
 * @returns {Boolean}
 * @private
 */
function isUsedCode(code) {
  return Permission._codes.indexOf(code) !== -1;
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
      tests.push(hasAll(permission));
      continue;
    }

    tests.push(has(permission));
  }

  return tests;
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
function hasAll(permission) {
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
    return hasAll(permission);
  }

  throw(new Error('Invalid permission'));
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
function hasAny(permission) {
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
 * Describes a permission.
 *
 * Used by the {@link permission.middleware} to check if a request is
 * authorized to proceed.
 *
 * @param code {(String|Number)} Permission's code. Note that permission
 *  codes **must** be unique throughout the entire application.
 * @param allowedByDefault {Boolean} Indicates if the permission is
 *  granted by default or not. This avoids the need to store and
 *  retrieve every single permission in/from a database.
 * @param test {function(req)} A function that tests the request and
 *  returns `true` if it passes and `false` if not.
 *
 * @constructor
 */
function Permission(code, allowedByDefault, test) {
  if (!(this instanceof Permission)) {
    return new Permission(code, allowedByDefault, test);
  }

  if (!code) {
    throw(new Error('Missing permission code'));
  }

  if (isUsedCode(code)) {
    throw(new Error('Duplicate permission code: ' + code));
  }

  Permission._codes.push(code);

  /**
   * Permission's code.
   * @type {(String|Number)}
   */
  this.code = code;

  /**
   * Whether the described permission is granted by default or not.
   * @type {Boolean}
   */
  this.allowedByDefault = Boolean(allowedByDefault);

  if (test) {
    if (typeof test !== 'function') {
      throw(new Error('Invalid permission test'));
    }

    this._test = test;
  }
}




/**
 * Stores the codes already in use to ensure that every `Permission` instance
 * has a unique code.
 * @type {Array}
 * @private
 */
Permission._codes = [];



/**
 * Tests a given request to see if it has the described permission.
 * @param req {Request}
 * @returns {Boolean} `true` if the request passes the test, `false`
 *  otherwise.
 */
Permission.prototype.test = function (req) {
  var permissions = this.getPermissions(req);
  var permission;
  var hasPermission;
  var isAllowedByDefault;

  if (permissions) {
    permission = permissions[this.code];
    hasPermission = permission === true;
    isAllowedByDefault = permission !== false && this.allowedByDefault;

    if (hasPermission || isAllowedByDefault) {
      return this._test ? Boolean(this._test(req)) : true;
    }
  }

  return false;
};

/**
 * Gets the permission object in which permissions are supposed to be looked
 * for. This should be a map, matching permission codes to a boolean,
 * indicating whether the request target of interest (user, client, etc) has
 * the the permission or not.
 *
 * > **NOTE:** subclasses MUST override this method.
 *
 * @param {Request} req
 * @returns {Object} An object representing a permission map.
 */
Permission.prototype.getPermissions = function () {
  throw(new Error(
    'Not implemented! ' +
    'Make sure you are calling a Permission subclass.'
  ));
};


exports = module.exports = Permission;

exports.has = has;

exports.all = hasAll;

exports.any = hasAny;

