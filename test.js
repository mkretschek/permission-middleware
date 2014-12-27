/**
 * Setup code for the test environment.
 */

/** Sets sinon-related assertions into Chai's should and expect APIs. */
(function () {
  'use strict';

  var chai = require('chai');
  var sinonChai = require('sinon-chai');

  chai.use(sinonChai);
})();
