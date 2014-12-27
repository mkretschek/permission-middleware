'use strict';

var any = require('./permission').any;
var has = require('./permission').has;

/**
 * Middleware factory for checking for a given set of permissions. If multiple
 * permissions are given, the middleware will pass onwards if any of them
 * allows the request:
 *
 *    // `foo` will be reached if **any** of the permissions allows it
 *    app.get('/foo', permission(ANY, OF, THESE), foo);
 *
 *    // `woo` will be reached only if **all** of the permissions pass
 *    app.get(
 *      '/woo',
 *      permission(ALL),
 *      permission(OF),
 *      permission(THESE),
 *      woo
 *    );
 *
 * @param {...Permission} permission Permission that will test the request.
 *
 * @returns {Function} A middleware that tests for the given permission(s).
 */
module.exports = function (permission) {
  var test = arguments.length > 1 ?
    any(Array.prototype.slice.call(arguments)) :
    has(permission);

  return function (req, res, next) {
    if (test(req)) {
      return next();
    }

    res.sendStatus(403);
  };
};