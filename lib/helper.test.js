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

    it('returns true if the permission is granted', function (done) {
      permission.getPermissions.returns({123: true});
      test(req, function (allow) {
        expect(allow).to.be.true;
        done();
      });
    });

    it('returns false if the permission is not granted', function (done) {
      permission.getPermissions.returns({123: false});
      test(req, function (allow) {
        expect(allow).to.be.false;
        done();
      });
    });

    it('checks for ALL permissions if multiple permissions are given',
      function (done) {
        var p1 = new Permission(1);
        var p2 = new Permission(2);
        var p3 = new Permission(3);
        var test = has(p1, p2, p3);

        sinon.stub(p1, 'getPermissions');
        sinon.stub(p2, 'getPermissions');
        sinon.stub(p3, 'getPermissions');

        p1.getPermissions.returns({1: true});
        p2.getPermissions.returns({2: true});
        p3.getPermissions.returns({3: true});
        test(req, function (allow) {
          expect(allow).to.be.true;

          p1.getPermissions.returns({1: false});
          p2.getPermissions.returns({2: true});
          p3.getPermissions.returns({3: true});
          test(req, function (allow) {
            expect(allow).to.be.false;

            p1.getPermissions.returns({1: true});
            p2.getPermissions.returns({2: true});
            p3.getPermissions.returns({3: false});
            test(req, function (allow) {
              expect(allow).to.be.false;

              p1.getPermissions.returns({1: false});
              p2.getPermissions.returns({2: false});
              p3.getPermissions.returns({3: false});
              test(req, function (allow) {
                expect(allow).to.be.false;
                done();
              });
            });
          });
        });
      });

    it('checks for ALL permissions if an array is given', function (done) {
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
      test(req, function (allow) {
        expect(allow).to.be.true;

        p1.getPermissions.returns({1: false});
        p2.getPermissions.returns({2: true});
        p3.getPermissions.returns({3: true});
        test(req, function (allow) {
          expect(allow).to.be.false;

          p1.getPermissions.returns({1: true});
          p2.getPermissions.returns({2: true});
          p3.getPermissions.returns({3: false});
          test(req, function (allow) {
            expect(allow).to.be.false;

            p1.getPermissions.returns({1: false});
            p2.getPermissions.returns({2: false});
            p3.getPermissions.returns({3: false});
            test(req, function (allow) {
              expect(allow).to.be.false;
              done();
            });
          });
        });
      });
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


  it('works with arrays', function (done) {
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
    test(req, function (allow) {
      expect(allow).to.be.true;

      p1.getPermissions.returns({1: false});
      p2.getPermissions.returns({2: true});
      p3.getPermissions.returns({3: true});
      test(req, function (allow) {
        expect(allow).to.be.false;

        p1.getPermissions.returns({1: true});
        p2.getPermissions.returns({2: true});
        p3.getPermissions.returns({3: false});
        test(req, function (allow) {
          expect(allow).to.be.false;

          p1.getPermissions.returns({1: false});
          p2.getPermissions.returns({2: false});
          p3.getPermissions.returns({3: false});
          test(req, function (allow) {
            expect(allow).to.be.false;
            done();
          });
        });
      });
    });
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

    it('returns true if all the permissions are granted', function (done) {
      permission1.getPermissions.returns({1: true});
      permission2.getPermissions.returns({2: true});
      permission3.getPermissions.returns({3: true});

      test(req, function (allow) {
        expect(allow).to.be.true;
        done();
      });
    });

    it('returns false if any of the permission is not granted',
      function (done) {
        permission1.getPermissions.returns({1: false});
        permission2.getPermissions.returns({2: true});
        permission3.getPermissions.returns({3: true});
        test(req, function (allow) {
          expect(allow).to.be.false;

          permission1.getPermissions.returns({1: true});
          permission2.getPermissions.returns({2: false});
          permission3.getPermissions.returns({3: true});
          test(req, function (allow) {
            expect(allow).to.be.false;

            permission1.getPermissions.returns({1: true});
            permission2.getPermissions.returns({2: true});
            permission3.getPermissions.returns({3: false});
            test(req, function (allow) {
              expect(allow).to.be.false;

              permission1.getPermissions.returns({1: false});
              permission2.getPermissions.returns({2: false});
              permission3.getPermissions.returns({3: true});
              test(req, function (allow) {
                expect(allow).to.be.false;

                permission1.getPermissions.returns({1: false});
                permission2.getPermissions.returns({2: true});
                permission3.getPermissions.returns({3: false});
                test(req, function (allow) {
                  expect(allow).to.be.false;

                  permission1.getPermissions.returns({1: true});
                  permission2.getPermissions.returns({2: false});
                  permission3.getPermissions.returns({3: false});
                  test(req, function (allow) {
                    expect(allow).to.be.false;
                    done();
                  });
                });
              });
            });
          });
        });
    });


    it('returns false if none of the permission is granted', function (done) {
      permission1.getPermissions.returns({1: false});
      permission2.getPermissions.returns({2: false});
      permission3.getPermissions.returns({3: false});
      test(req, function (allow) {
        expect(allow).to.be.false;
        done();
      });
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


  it('treats permissions as an ANY clause if a single argument is given',
    function (done) {
      var permission1 = new Permission(1);
      var permission2 = new Permission(2);
      var permission3 = new Permission(3);
      var test = any([permission1, permission2, permission3]);

      sinon.stub(permission1, 'getPermissions');
      sinon.stub(permission2, 'getPermissions');
      sinon.stub(permission3, 'getPermissions');

      permission1.getPermissions.returns({1: true});
      permission2.getPermissions.returns({2: true});
      permission3.getPermissions.returns({3: true});
      test(req, function (allow) {
        expect(allow).to.be.true;

        permission1.getPermissions.returns({1: false});
        permission2.getPermissions.returns({2: true});
        permission3.getPermissions.returns({3: true});
        test(req, function (allow) {
          expect(allow).to.be.true;

          permission1.getPermissions.returns({1: true});
          permission2.getPermissions.returns({2: false});
          permission3.getPermissions.returns({3: true});
          test(req, function (allow) {
            expect(allow).to.be.true;

            permission1.getPermissions.returns({1: true});
            permission2.getPermissions.returns({2: true});
            permission3.getPermissions.returns({3: false});
            test(req, function (allow) {
              expect(allow).to.be.true;

              permission1.getPermissions.returns({1: false});
              permission2.getPermissions.returns({2: false});
              permission3.getPermissions.returns({3: true});
              test(req, function (allow) {
                expect(allow).to.be.true;

                permission1.getPermissions.returns({1: false});
                permission2.getPermissions.returns({2: true});
                permission3.getPermissions.returns({3: false});
                test(req, function (allow) {
                  expect(allow).to.be.true;

                  permission1.getPermissions.returns({1: true});
                  permission2.getPermissions.returns({2: false});
                  permission3.getPermissions.returns({3: false});
                  test(req, function (allow) {
                    expect(allow).to.be.true;
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });

  it('treats arrays as ALL calls if more than one argument is given',
    function (done) {
      var permission1 = new Permission(1);
      var permission2 = new Permission(2);
      var permission3 = new Permission(3);
      var test = any([permission1, permission2], permission3);

      sinon.stub(permission1, 'getPermissions');
      sinon.stub(permission2, 'getPermissions');
      sinon.stub(permission3, 'getPermissions');


      permission1.getPermissions.returns({1: true});
      permission2.getPermissions.returns({2: true});
      permission3.getPermissions.returns({3: true});
      test(req, function (allow) {
        expect(allow).to.be.true;

        permission1.getPermissions.returns({1: false});
        permission2.getPermissions.returns({2: false});
        permission3.getPermissions.returns({3: true});
        test(req, function (allow) {
          expect(allow).to.be.true;

          // The array is treated as an ALL permission, therefore,
          // p1 and p2 must be true for it to pass.
          permission1.getPermissions.returns({1: false});
          permission2.getPermissions.returns({2: true});
          permission3.getPermissions.returns({3: false});
          test(req, function (allow) {
            expect(allow).to.be.false;

            permission1.getPermissions.returns({1: true});
            permission2.getPermissions.returns({2: false});
            permission3.getPermissions.returns({3: false});
            test(req, function (allow) {
              expect(allow).to.be.false;

              permission1.getPermissions.returns({1: true});
              permission2.getPermissions.returns({2: true});
              permission3.getPermissions.returns({3: false});
              test(req, function (allow) {
                expect(allow).to.be.true;
                done();
              });
            });
          });
        });
      });
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

    it('returns true if all the permissions are granted', function (done) {
      permission1.getPermissions.returns({1: true});
      permission2.getPermissions.returns({2: true});
      permission3.getPermissions.returns({3: true});
      test(req, function (allow) {
        expect(allow).to.be.true;
        done();
      });
    });

    it('returns true if any of the permissions is granted', function (done) {
      permission1.getPermissions.returns({1: false});
      permission2.getPermissions.returns({2: true});
      permission3.getPermissions.returns({3: true});
      test(req, function (allow) {
        expect(allow).to.be.true;

        permission1.getPermissions.returns({1: false});
        permission2.getPermissions.returns({2: false});
        permission3.getPermissions.returns({3: true});
        test(req, function (allow) {
          expect(allow).to.be.true;

          permission1.getPermissions.returns({1: false});
          permission2.getPermissions.returns({2: true});
          permission3.getPermissions.returns({3: false});
          test(req, function (allow) {
            expect(allow).to.be.true;

            permission1.getPermissions.returns({1: true});
            permission2.getPermissions.returns({2: false});
            permission3.getPermissions.returns({3: true});
            test(req, function (allow) {
              expect(allow).to.be.true;

              permission1.getPermissions.returns({1: true});
              permission2.getPermissions.returns({2: false});
              permission3.getPermissions.returns({3: false});
              test(req, function (allow) {
                expect(allow).to.be.true;

                permission1.getPermissions.returns({1: true});
                permission2.getPermissions.returns({2: true});
                permission3.getPermissions.returns({3: false});
                test(req, function (allow) {
                  expect(allow).to.be.true;
                  done();
                });
              });
            });
          });
        });
      });
    });

    it('returns false if none of the permission is granted', function (done) {
      permission1.getPermissions.returns({1: false});
      permission2.getPermissions.returns({2: false});
      permission3.getPermissions.returns({3: false});
      test(req, function (allow) {
        expect(allow).to.be.false;
        done();
      });
    });
  });
});