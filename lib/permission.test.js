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

      it('calls #getPermissions()', function () {
        expect(permission.test(req)).to.be.true;
        expect(permission.getPermissions).to.have.been.calledOnce;
      });

      it('checks if the permission is in the list', function () {
        expect(permission.test(req)).to.be.true;
        permission.getPermissions.returns({123: false});
        expect(permission.test(req)).to.be.false;
      });


      it('respects the `allowedByDefault` flag', function () {
        var permission1 = new Permission(456, true);
        sinon.stub(permission1, 'getPermissions');

        var permission2 = new Permission(789, false);
        sinon.stub(permission2, 'getPermissions');


        // Allowed by default and permission not listed: pass
        permission1.getPermissions.returns({});
        expect(permission1.test(req)).to.be.true;

        // Allowed by default and permission listed and granted: pass
        permission1.getPermissions.returns({456: true});
        expect(permission1.test(req)).to.be.true;

        // Allowed by default, permission listed and denied: deny
        permission1.getPermissions.returns({456: false});
        expect(permission1.test(req)).to.be.false;

        // Denied by default and permission not listed: deny
        permission2.getPermissions.returns({});
        expect(permission2.test(req)).to.be.false;

        // Denied by default, permission listed and denied: deny
        permission2.getPermissions.returns({789: false});
        expect(permission2.test(req)).to.be.false;

        // Denied by default, permission listed and granted: pass
        permission2.getPermissions.returns({789: true});
        expect(permission2.test(req)).to.be.true;
      });

      it('calls the permission\'s test function if provided', function () {
        var test = sinon.stub();
        var permission = new Permission(456, false, test);
        sinon.stub(permission, 'getPermissions');

        // Test function should not be called if the permission is not granted
        permission.getPermissions.returns({456: false});
        permission.test(req);
        expect(test).to.not.have.been.called;

        permission.getPermissions.returns({456: true});
        permission.test(req);
        expect(test).to.have.been.calledOnce;
        expect(test).to.have.been.calledWith(req);
      });


      it('fails if the test function fails', function () {
        var test = sinon.stub();
        var permission = new Permission(456, false, test);
        sinon.stub(permission, 'getPermissions');

        permission.getPermissions.returns({456: true});
        test.returns(false);
        expect(permission.test(req)).to.be.false;
        expect(test).to.have.been.calledOnce;

        test.reset();
        test.returns(true);
        expect(permission.test(req)).to.be.true;
        expect(test).to.have.been.calledOnce;
      });


      it('returns `true` if permission is granted', function () {
        permission.getPermissions.returns({123: true});
        expect(permission.test(req)).to.be.true;
      });


      it('returns `false` if permission is NOT granted', function () {
        permission.getPermissions.returns({123: false});
        expect(permission.test(req)).to.be.false;
      });

      it('returns `false` if no permissions are retrieved', function () {
        permission.getPermissions.returns(null);
        expect(permission.test(req)).to.be.false;
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
});

