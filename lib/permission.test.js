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

before(clearPermissionCodes);
afterEach(clearPermissionCodes);

beforeEach(function () {
  permission = new Permission(123);
  sinon.stub(permission, 'getPermissions');
});


describe('Permission', function () {

  it('is accessible', function () {
    expect(Permission).to.be.defined;
  });

  it('is a constructor', function () {
    expect(Permission).to.be.a('function');
    expect(new Permission(456)).to.be.instanceof(Permission);
  });

  it('works without the \'new\' keyword', function () {
    expect(Permission(456)).to.be.instanceof(Permission);
  });

  it('requires a code to be defined', function () {
    function withoutCode() {
      return new Permission();
    }

    expect(withoutCode).to.throw('Missing permission code');
  });

  it('checks for duplicate permission codes', function () {
    var permission = new Permission(456);

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

        expect(callGetPermissions).to.throw(/^Not implemented/)
      });
    });
  });
});



describe('has()', function () {
  var has = require('./permission').has;

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
      test = has(permission);
    });

    it('is a function', function () {
      expect(test).to.be.a('function');
    });

    it('is the argument itself if it\'s a function', function () {
      /* istanbul ignore next: no need to execute the noop */
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
  var all = require('./permission').all;

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
  var any = require('./permission').any;

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