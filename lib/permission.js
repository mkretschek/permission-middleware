'use strict';


var inherits = require('util').inherits;

/**
 * Defines the `Permission` constructor used as a base for more specific
 * types of permissions.
 *
 * @module permission
 * @type {Function}
 * @constructor
 */



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

  if (!code && code !== 0) {
    throw(new Error('Missing permission code'));
  }

  if (Permission.isUsedCode(code)) {
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
 * Tests a given request to see if it has the described permission.
 * @param {object} req
 * @param {function(boolean)} done A callback called with a boolean indicating
 *  whether the request is allowed to proceed or not.
 */
Permission.prototype.test = function (req, done) {
  var permissions = this.getPermissions(req);
  var permission;
  var hasPermission;
  var isAllowedByDefault;

  if (permissions) {
    permission = permissions[this.code];
    hasPermission = Boolean(permission);
    isAllowedByDefault = permission === undefined && this.allowedByDefault;

    if (hasPermission || isAllowedByDefault) {
      if (this._test) {
        if (this._test.length <= 1) {
          // sync test
          done(this._test(req));
        } else {
          this._test(req, done);
        }
      } else {
        done(true);
      }

      return;
    }
  }

  done(false);
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


/**
 * Stores the codes already in use to ensure that every `Permission` instance
 * has a unique code.
 * @type {Array}
 * @private
 */
Permission._codes = [];


/**
 * Checks if the given code is already in use by another permission.
 * @param code {(String|Number)}
 * @returns {Boolean}
 * @private
 */
Permission.isUsedCode = function (code) {
  return Permission._codes.indexOf(code) !== -1;
};


/**
 * Creates a new `Permission` subclass.
 * @param {function(req)} getPermissions A function responsible for
 *  retrieving the permission set for a specific agent from the given
 *  request object.
 * @returns {function} A `Permission` subclass
 */
Permission.create = function (getPermissions) {
  function PermissionType() {
    PermissionType.super_.apply(this, arguments);
  }

  inherits(PermissionType, Permission);

  if (typeof getPermissions === 'function') {
    PermissionType.prototype.getPermissions = getPermissions;
  }

  return PermissionType;
};



module.exports = Permission;
