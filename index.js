'use strict';

exports = module.exports = require('./lib/middleware');

exports.Permission = require('./lib/permission');

exports.any = require('./lib/helper').any;
exports.all = require('./lib/helper').all;
exports.has = require('./lib/helper').has;