'use strict';
/* global describe:true, it:true */


var expect = require('chai').expect;
var sinon = require('sinon');

var Permission = require('./permission');

var permission;
var req = {};

function clearPermissionCodes() {
  Permission._codes = [];
}




describe('has()', function () {
  var has = require('./helper').has;

  before(clearPermissionCodes);
  afterEach(clearPermissionCodes);

  it('is accessible', function () {
    expect(has).to.be.defined;
  });

  it('is a function', function () {
    expect(has).to.be.a('function');
  });


  it('throws an error if an invalid permission or test function is passed',
    function () {
      function hasInvalidPermission() {
        return has('foo');
      }

      expect(hasInvalidPermission).to.throw('Invalid permission');
    });


  describe('generated function', function () {
    var test;

    beforeEach(function () {
      permission = new Permission(123);
      sinon.stub(permission, 'getPermissions');
      test = has(permission);
    });

    it('is a function', function () {
      expect(test).to.be.a('function');
    });

    it('is the argument itself if it\'s a function', function () {
      function noop() {}
      var test = has(noop);
      expect(test).to.equal(noop);
    });

    it('returns true if the permission is granted', function () {
      permission.getPermissions.returns({123: true});
      expect(test(req)).to.be.true;
    });

    it('returns false if the permission is not granted', function () {
      permission.getPermissions.returns({123: false});
      expect(test(req)).to.be.false;
    });

    it('checks for ALL permissions if an array is given', function () {
      var p1 = new Permission(1);
      var p2 = new Permission(2);
      var p3 = new Permission(3);
      var test = has([p1, p2, p3]);

      sinon.stub(p1, 'getPermissions');
      sinon.stub(p2, 'getPermissions');
      sinon.stub(p3, 'getPermissions');

      p1.getPermissions.returns({1: true});
      p2.getPermissions.returns({2: true});
      p3.getPermissions.returns({3: true});
      expect(test(req)).to.be.true;

      p1.getPermissions.returns({1: false});
      p2.getPermissions.returns({2: true});
      p3.getPermissions.returns({3: true});
      expect(test(req)).to.be.false;

      p1.getPermissions.returns({1: false});
      p2.getPermissions.returns({2: false});
      p3.getPermissions.returns({3: false});
      expect(test(req)).to.be.false;
    });
  });
});



describe('all()', function () {
  var all = require('./helper').all;

  before(clearPermissionCodes);
  afterEach(clearPermissionCodes);

  it('is accessible', function () {
    expect(all).to.be.defined;
  });

  it('is a function', function () {
    expect(all).to.be.a('function');
  });


  it('works with arrays', function () {
    var p1 = new Permission(1);
    var p2 = new Permission(2);
    var p3 = new Permission(3);
    var test = all([p1, p2], p3);

    sinon.stub(p1, 'getPermissions');
    sinon.stub(p2, 'getPermissions');
    sinon.stub(p3, 'getPermissions');

    p1.getPermissions.returns({1: true});
    p2.getPermissions.returns({2: true});
    p3.getPermissions.returns({3: true});
    expect(test(req)).to.be.true;

    p1.getPermissions.returns({1: false});
    p2.getPermissions.returns({2: true});
    p3.getPermissions.returns({3: true});
    expect(test(req)).to.be.false;

    p1.getPermissions.returns({1: false});
    p2.getPermissions.returns({2: false});
    p3.getPermissions.returns({3: false});
    expect(test(req)).to.be.false;
  });


  describe('generated function', function () {
    var permission1;
    var permission2;
    var permission3;
    var test;

    beforeEach(function () {
      permission1 = new Permission(1);
      permission2 = new Permission(2);
      permission3 = new Permission(3);

      sinon.stub(permission1, 'getPermissions');
      sinon.stub(permission2, 'getPermissions');
      sinon.stub(permission3, 'getPermissions');

      test = all(permission1, permission2, permission3);
    });

    it('is a function', function () {
      expect(test).to.be.a('function');
    });

    it('returns true if all the permissions are granted', function () {
      permission1.getPermissions.returns({1: true});
      permission2.getPermissions.returns({2: true});
      permission3.getPermissions.returns({3: true});
      expect(test(req)).to.be.true;
    });

    it('returns false if any of the permission is not granted', function () {
      permission1.getPermissions.returns({1: false});
      permission2.getPermissions.returns({2: true});
      permission3.getPermissions.returns({3: true});
      expect(test(req)).to.be.false;

      permission1.getPermissions.returns({1: true});
      permission2.getPermissions.returns({2: false});
      permission3.getPermissions.returns({3: true});
      expect(test(req)).to.be.false;

      permission1.getPermissions.returns({1: true});
      permission2.getPermissions.returns({2: true});
      permission3.getPermissions.returns({3: false});
      expect(test(req)).to.be.false;

      permission1.getPermissions.returns({1: false});
      permission2.getPermissions.returns({2: false});
      permission3.getPermissions.returns({3: true});
      expect(test(req)).to.be.false;

      permission1.getPermissions.returns({1: false});
      permission2.getPermissions.returns({2: true});
      permission3.getPermissions.returns({3: false});
      expect(test(req)).to.be.false;

      permission1.getPermissions.returns({1: true});
      permission2.getPermissions.returns({2: false});
      permission3.getPermissions.returns({3: false});
      expect(test(req)).to.be.false;
    });


    it('returns false if none of the permission is granted', function () {
      permission1.getPermissions.returns({1: false});
      permission2.getPermissions.returns({2: false});
      permission3.getPermissions.returns({3: false});
      expect(test(req)).to.be.false;
    });
  });
});



describe('any()', function () {
  var any = require('./helper').any;

  before(clearPermissionCodes);
  afterEach(clearPermissionCodes);

  it('is accessible', function () {
    expect(any).to.be.defined;
  });

  it('is a function', function () {
    expect(any).to.be.a('function');
  });


  it('treats permissions as an ANY clause if a single array is given',
    function () {
      var p1 = new Permission(1);
      var p2 = new Permission(2);
      var p3 = new Permission(3);
      var test = any([p1, p2, p3]);

      sinon.stub(p1, 'getPermissions');
      sinon.stub(p2, 'getPermissions');
      sinon.stub(p3, 'getPermissions');

      p1.getPermissions.returns({1: true});
      p2.getPermissions.returns({2: true});
      p3.getPermissions.returns({3: true});
      expect(test(req)).to.be.true;

      p1.getPermissions.returns({1: false});
      p2.getPermissions.returns({2: false});
      p3.getPermissions.returns({3: true});
      expect(test(req)).to.be.true;

      p1.getPermissions.returns({1: false});
      p2.getPermissions.returns({2: true});
      p3.getPermissions.returns({3: false});
      expect(test(req)).to.be.true;

      p1.getPermissions.returns({1: true});
      p2.getPermissions.returns({2: true});
      p3.getPermissions.returns({3: false});
      expect(test(req)).to.be.true;

      p1.getPermissions.returns({1: false});
      p2.getPermissions.returns({2: false});
      p3.getPermissions.returns({3: false});
      expect(test(req)).to.be.false;
    });

  it('treats arrays as ALL calls if more than one argument is given',
    function () {
      var p1 = new Permission(1);
      var p2 = new Permission(2);
      var p3 = new Permission(3);
      var test = any([p1, p2], p3);

      sinon.stub(p1, 'getPermissions');
      sinon.stub(p2, 'getPermissions');
      sinon.stub(p3, 'getPermissions');

      p1.getPermissions.returns({1: true});
      p2.getPermissions.returns({2: true});
      p3.getPermissions.returns({3: true});
      expect(test(req)).to.be.true;

      p1.getPermissions.returns({1: false});
      p2.getPermissions.returns({2: false});
      p3.getPermissions.returns({3: true});
      expect(test(req)).to.be.true;

      // The array is treated as an ALL permission, therefore,
      // p1 and p2 must be true for it to pass.
      p1.getPermissions.returns({1: false});
      p2.getPermissions.returns({2: true});
      p3.getPermissions.returns({3: false});
      expect(test(req)).to.be.false;

      p1.getPermissions.returns({1: true});
      p2.getPermissions.returns({2: true});
      p3.getPermissions.returns({3: false});
      expect(test(req)).to.be.true;
    });

  describe('generated function', function () {
    var permission1;
    var permission2;
    var permission3;
    var test;

    beforeEach(function () {
      permission1 = new Permission(1);
      permission2 = new Permission(2);
      permission3 = new Permission(3);

      sinon.stub(permission1, 'getPermissions');
      sinon.stub(permission2, 'getPermissions');
      sinon.stub(permission3, 'getPermissions');

      test = any(permission1, permission2, permission3);
    });

    it('is a function', function () {
      expect(test).to.be.a('function');
    });

    it('returns true if all the permissions are granted', function () {
      permission1.getPermissions.returns({1: true});
      permission2.getPermissions.returns({2: true});
      permission3.getPermissions.returns({3: true});
      expect(test(req)).to.be.true;
    });

    it('returns true if any of the permissions is granted', function () {
      permission1.getPermissions.returns({1: true});
      permission2.getPermissions.returns({2: false});
      permission3.getPermissions.returns({3: false});
      expect(test(req)).to.be.true;

      permission1.getPermissions.returns({1: false});
      permission2.getPermissions.returns({2: true});
      permission3.getPermissions.returns({3: false});
      expect(test(req)).to.be.true;

      permission1.getPermissions.returns({1: false});
      permission2.getPermissions.returns({2: false});
      permission3.getPermissions.returns({3: true});
      expect(test(req)).to.be.true;

      permission1.getPermissions.returns({1: true});
      permission2.getPermissions.returns({2: true});
      permission3.getPermissions.returns({3: false});
      expect(test(req)).to.be.true;

      permission1.getPermissions.returns({1: true});
      permission2.getPermissions.returns({2: false});
      permission3.getPermissions.returns({3: true});
      expect(test(req)).to.be.true;

      permission1.getPermissions.returns({1: false});
      permission2.getPermissions.returns({2: true});
      permission3.getPermissions.returns({3: true});
      expect(test(req)).to.be.true;
    });

    it('returns false if none of the permission is granted', function () {
      permission1.getPermissions.returns({1: false});
      permission2.getPermissions.returns({2: false});
      permission3.getPermissions.returns({3: false});
      expect(test(req)).to.be.false;
    });
  });
});