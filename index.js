'use strict';

exports = module.exports = require('./lib/middleware');

exports.Permission = require('./lib/permission');

exports.any = require('./lib/permission').any;
exports.all = require('./lib/permission').all;
exports.has = require('./lib/permission').has;