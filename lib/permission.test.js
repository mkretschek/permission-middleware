'use strict';
/* global describe:true, it:true */


var expect = require('chai').expect;
var sinon = require('sinon');
var async = require('async');

var Permission = require('./permission');

var permission;
var req = {};

function clearPermissionCodes() {
  Permission._codes = [];
}

describe('Permission', function () {
  before(clearPermissionCodes);
  afterEach(clearPermissionCodes);

  beforeEach(function () {
    permission = new Permission(123);
    sinon.stub(permission, 'getPermissions');
  });


  it('is accessible', function () {
    expect(Permission).to.be.defined;
  });

  it('is a constructor', function () {
    expect(Permission).to.be.a('function');
    expect(new Permission(456)).to.be.instanceof(Permission);
  });

  it('works without the \'new\' keyword', function () {
    /* jshint newcap:false */
    expect(Permission(456)).to.be.instanceof(Permission);
  });

  it('requires a code to be defined', function () {
    function withoutCode() {
      return new Permission();
    }

    expect(withoutCode).to.throw('Missing permission code');
  });


  it('allows 0 (zero) to be used as a code', function () {
    function useCodeZero() {
      return new Permission(0);
    }

    expect(useCodeZero).not.to.throw;
  });

  it('checks for duplicate permission codes', function () {
    new Permission(456);

    function reuseCode() {
      return new Permission(456);
    }

    expect(reuseCode).to.throw('Duplicate permission code: 456');
  });


  it('throws an error if the provided test is not a function', function () {
    function withInvalidTest() {
      return new Permission(2, false, 'not a function');
    }

    expect(withInvalidTest).to.throw('Invalid permission test');
  });


  describe('instance', function () {

    describe('#test()', function () {
      beforeEach(function () {
        permission.getPermissions.returns({
          123: true
        });
      });

      it('is accessible', function () {
        expect(permission.test).to.be.defined;
      });

      it('is a function', function () {
        expect(permission.test).to.be.a('function');
      });

      it('checks if the permission is in the list', function (done) {
        permission.test(req, function (allow) {
          expect(allow).to.be.true;

          permission.getPermissions.returns({123: false});

          permission.test(req, function (allow) {
            expect(allow).to.be.false;
            done();
          });
        });
      });


      it('respects the `allowedByDefault` flag', function (done) {
        var permission1 = new Permission(456, true);
        sinon.stub(permission1, 'getPermissions');

        var permission2 = new Permission(789, false);
        sinon.stub(permission2, 'getPermissions');

        var tests = [];

        function convert(cb) {
          return function (result) {
            cb(null, result);
          }
        }

        tests.push(function (cb) {
          // Allowed by default and permission not listed: pass
          permission1.getPermissions.returns({});
          permission1.test(req, convert(cb));
        });

        tests.push(function (cb) {
          // Allowed by default and permission listed and granted: pass
          permission1.getPermissions.returns({456: true});
          permission1.test(req, convert(cb));
        });

        tests.push(function (cb) {
          // Allowed by default, permission listed and denied: deny
          permission1.getPermissions.returns({456: false});
          permission1.test(req, convert(cb));
        });

        tests.push(function (cb) {
          // Denied by default and permission not listed: deny
          permission2.getPermissions.returns({});
          permission2.test(req, convert(cb));
        });

        tests.push(function (cb) {
          // Denied by default, permission listed and denied: deny
          permission2.getPermissions.returns({789: false});
          permission2.test(req, convert(cb));
        });

        tests.push(function (cb) {
          // Denied by default, permission listed and granted: pass
          permission2.getPermissions.returns({789: true});
          permission2.test(req, convert(cb));
        });

        async.parallel(tests, function (err, results) {
          if (err) { return done(err); }

          expect(results[0]).to.be.true;
          expect(results[1]).to.be.true;
          expect(results[2]).to.be.false;
          expect(results[3]).to.be.false;
          expect(results[4]).to.be.false;
          expect(results[5]).to.be.true;

          done();
        });
      });

      it('calls the permission\'s test function', function (done) {
        var test = sinon.stub();
        test.returns(true);

        var permission = new Permission(456, false, test);

        sinon.stub(permission, 'getPermissions');
        permission.getPermissions.returns({456: true});

        permission.test(req, function (allow) {
          expect(test).to.have.been.calledOnce;
          expect(allow).to.be.true;
          done();
        });
      });

      it('does NOT call the test function if permission is not granted',
        function (done) {
          var test = sinon.stub();

          var permission = new Permission(456, false, test);
          sinon.stub(permission, 'getPermissions');
          permission.getPermissions.returns({456: false});

          permission.test(req, function (allow) {
            expect(test).to.not.have.been.called;
            expect(allow).to.be.false;
            done();
          });
        });

      describe('with sync test function', function () {
        it('passes the result to the callback', function (done) {
          var permission = new Permission(456, false, function () {
            return 'foo';
          });

          sinon.stub(permission, 'getPermissions');
          permission.getPermissions.returns({456: true});

          permission.test(req, function (allow) {
            expect(allow).to.equal('foo');
            done();
          });
        });
      });


      describe('with async test function', function () {
        it('passes the result to the callback', function (done) {
          var permission = new Permission(456, false, function (req, cb) {
            process.nextTick(function () {
              cb('foo');
            });
          });

          sinon.stub(permission, 'getPermissions');
          permission.getPermissions.returns({456: true});

          permission.test(req, function (allow) {
            expect(allow).to.equal('foo');
            done();
          });
        });
      });
    });


    describe('#getPermissions()', function () {
      it('is accessible', function () {
        expect(permission.getPermissions).to.be.defined;
      });

      it('is a function', function () {
        expect(permission.getPermissions).to.be.a('function');
      });

      // Permission is supposed to be subclassed and #getPermissions() should
      // be implemented on these subclasses.
      it('throws an error', function () {
        var permission = new Permission(456);

        function callGetPermissions() {
          permission.getPermissions();
        }

        expect(callGetPermissions).to.throw(/^Not implemented/);
      });
    });
  });


  describe('.create()', function () {
    it('is accessible', function () {
      expect(Permission.create).to.be.defined;
    });

    it('is a function', function () {
      expect(Permission.create).to.be.a('function');
    });

    it('returns a function', function () {
      var result = Permission.create(function () {});
      expect(result).to.be.a('function');
    });

    describe('created subclass', function () {
      var getter;
      var SubPermission;

      beforeEach(function () {
        getter = sinon.stub();
        SubPermission = Permission.create(getter);
      });

      it('is a constructor', function () {
        expect(SubPermission).to.be.a('function');
        expect(new SubPermission(456, false)).to.be.instanceof(SubPermission);
      });

      it('is a subclass of Permission', function () {
        expect(SubPermission).to.be.a('function');
        var sub = new SubPermission(456, false);
        expect(sub).to.be.instanceof(Permission);
      });

      it('uses the given permissions getter', function () {
        var sub = new SubPermission(456, false);
        expect(sub.getPermissions).to.equal(getter);
      });

      it('ignores the given getter if not a function', function () {
        var SubPermission = Permission.create('foo');
        var sub = new SubPermission(456, false);
        expect(sub.getPermissions).to.not.equal('foo');
      });
    });
  });

});

