'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');

var middleware = require('./middleware');
var Permission = require('./permission');

var all = require('./permission').all;
var any = require('./permission').any;

describe('middleware', function () {
  var p;
  var p1, p2, p3;
  var next = sinon.stub();
  var req = {};
  var res = {
    sendStatus: sinon.stub()
  };

  function clearPermissionCodes() {
    Permission._codes = [];
  }

  before(clearPermissionCodes);
  afterEach(clearPermissionCodes);

  beforeEach(function () {
    p = new Permission(0);
    p1 = new Permission(1);
    p2 = new Permission(2);
    p3 = new Permission(3);

    sinon.stub(p, 'getPermissions');
    sinon.stub(p1, 'getPermissions');
    sinon.stub(p2, 'getPermissions');
    sinon.stub(p3, 'getPermissions');

    res.sendStatus.reset();
    next.reset();
  });


  it('is accessible', function () {
    expect(middleware).to.be.defined;
  });

  it('is a function', function () {
    expect(middleware).to.be.a('function');
  });

  it('returns a middleware', function () {
    var mid = middleware(p);
    expect(mid).to.be.a('function');
    expect(mid).to.have.length(3);
  });

  it('calls next() if the test pass', function () {
    p.getPermissions.returns({0: true});
    expect(p.test(req)).to.be.true;

    var mid = middleware(p);
    mid(req, res, next);
    expect(next).to.have.been.calledOnce;
    expect(res.sendStatus).to.not.have.been.called;
  });

  it('does not call next() if the test fails', function () {
    p.getPermissions.returns({0: false});
    expect(p.test(req)).to.be.false;

    var mid = middleware(p);
    mid(req, res, next);
    expect(next).to.not.have.been.called;
    expect(res.sendStatus).to.have.been.calledOnce;
  });

  it('sends HTTP status 403 (FORBIDDEN) if test fails', function () {
    p.getPermissions.returns({0: false});
    var mid = middleware(p);
    mid(req, res, next);
    expect(res.sendStatus).to.have.been.calledWith(403);
  });

  it('treats multiple permissions as an ANY clause', function () {
    var mid = middleware(p1, p2, p3);

    p1.getPermissions.returns({1: true});
    p2.getPermissions.returns({2: true});
    p3.getPermissions.returns({3: true});
    mid(req, res, next);
    expect(next).to.have.been.calledOnce;
    next.reset();

    p1.getPermissions.returns({1: false});
    p2.getPermissions.returns({2: true});
    p3.getPermissions.returns({3: true});
    mid(req, res, next);
    expect(next).to.have.been.calledOnce;
    next.reset();

    p1.getPermissions.returns({1: true});
    p2.getPermissions.returns({2: false});
    p3.getPermissions.returns({3: false});
    mid(req, res, next);
    expect(next).to.have.been.calledOnce;
    next.reset();

    p1.getPermissions.returns({1: false});
    p2.getPermissions.returns({2: false});
    p3.getPermissions.returns({3: false});
    mid(req, res, next);
    expect(next).to.not.have.been.called;
    next.reset();
  });


  it('treats arrays of permissions as an ALL clause', function () {
    var mid = middleware([p1, p2, p3]);

    p1.getPermissions.returns({1: true});
    p2.getPermissions.returns({2: true});
    p3.getPermissions.returns({3: true});
    mid(req, res, next);
    expect(next).to.have.been.calledOnce;
    next.reset();

    p1.getPermissions.returns({1: false});
    p2.getPermissions.returns({2: true});
    p3.getPermissions.returns({3: true});
    mid(req, res, next);
    expect(next).to.not.have.been.called;
    next.reset();

    p1.getPermissions.returns({1: true});
    p2.getPermissions.returns({2: false});
    p3.getPermissions.returns({3: false});
    mid(req, res, next);
    expect(next).to.not.have.been.called;
    next.reset();

    p1.getPermissions.returns({1: false});
    p2.getPermissions.returns({2: false});
    p3.getPermissions.returns({3: false});
    mid(req, res, next);
    expect(next).to.not.have.been.called;
    next.reset();
  });


  it('throws if no permission is passed', function () {
    function withoutPermissions() {
      return middleware();
    }

    expect(withoutPermissions).to.throw('Missing permissions');
  });

  it('passes the request onwards to the test function', function () {
    var mid = middleware(p);
    sinon.spy(p, 'test');
    mid(req, res, next);
    expect(p.test).to.have.been.calledWith(req);
  });

  it('works with the helper functions', function () {
    var mid = middleware(all(p, any(p1, p2, p3)));

    // All permissions granted: pass
    p.getPermissions.returns({0: true});
    p1.getPermissions.returns({1: true});
    p2.getPermissions.returns({2: true});
    p3.getPermissions.returns({3: true});
    mid(req, res, next);
    expect(next).to.have.been.calledOnce;
    next.reset();


    // any() should pass
    // all() should pass too
    p.getPermissions.returns({0: true});
    p1.getPermissions.returns({1: true});
    p2.getPermissions.returns({2: false});
    p3.getPermissions.returns({3: false});
    mid(req, res, next);
    expect(next).to.have.been.calledOnce;
    next.reset();


    // When any() fails, so should all()
    p.getPermissions.returns({0: true});
    p1.getPermissions.returns({1: false});
    p2.getPermissions.returns({2: false});
    p3.getPermissions.returns({3: false});
    mid(req, res, next);
    expect(next).to.not.have.been.called;
    next.reset();

    // When any() passes, but other permissions in all() fail
    p.getPermissions.returns({0: false});
    p1.getPermissions.returns({1: true});
    p2.getPermissions.returns({2: true});
    p3.getPermissions.returns({3: true});
    mid(req, res, next);
    expect(next).to.not.have.been.called;
    next.reset();

    // All failed
    p.getPermissions.returns({0: false});
    p1.getPermissions.returns({1: false});
    p2.getPermissions.returns({2: false});
    p3.getPermissions.returns({3: false});
    mid(req, res, next);
    expect(next).to.not.have.been.called;
    next.reset();
  });
});