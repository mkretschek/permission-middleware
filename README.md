permission-middleware
=====================

A simple permissions middleware for Express applications which helps you
to define and organize your application's access permissions.

This will, however, make no assumptions about how to store, retrieve and
associate those permissions to a given target (user, client, app, etc.). If
you are looking for a full-fledged solution for managing and checking
permissions, this middleware is probably not what you are looking for.


## Instalation

As usual:

```
npm install permission-middleware --save
```

## Usage

First, create a new permission type. The permission type defines how the set
of permissions is retrieved for a specific target. Probably, the most common
permission types would include `UserPermission` and `ClientPermission`.



To create a new permission type we use `Permission.create()`, which receives
a function responsible for retrieving a "permission set". A **permission set**
is an object indicating which permissions the **current request**'s active
user/client/app has:

```js
// Permission sets map permission codes to a boolean indicating whether
// the permission is granted or denied to a specific agent active in the
// current request
{
  CREATE_USER: false,
  EDIT_USER: true,
  DELETE_USER: false
}

// Codes may be numbers too (more about codes below)
{
  4001: false,
  4002: true,
  4003: true,
  6022: false,
  301:  true
}

```

And this is how permission types are defined:

```js
var Permission = require('permission-middleware').Permission;

var UserPermission = Permission.create(function (req) {
  // If req.user.permissions is a valid permission set, this is all you need...
  return req.user && req.user.permissions || null;
});

var ClientPermission = Permission.create(function (req) {
  return req.client && req.client.permissions || null;
});
```

> Returning `null` from the `getPermissions` function denies all permissions of
that permission type in a specific request.



With your permission types created, you can start defining your permissions:

```js
// User permission definitions
exports.User = {
  // By default, any user can create posts
  CREATE_POST:          new UserPermission(10001, true),

  // Users may edit their own posts. Editors may edit any post.
  EDIT_POST:            new UserPermission(10002, true, any(ownsPost, isEditor)),

  // Users may delete their own posts.
  DELETE_POST:          new UserPermission(10003, true, ownsPost),

  // Only some special users may block posts
  BLOCK_POST:           new UserPermission(10004, false),
};


// Client permission definitions
exports.Client = {
  // By default, any client should be able to create, edit and delete posts
  MANAGE_POSTS:         new ClientPermission(20001, true),

  // Only certain clients should be able to create or edit users
  MANAGE_USERS:         new ClientPermission(20002, false)
};


// General permission definitions (joins User and Client permissions)
exports.CREATE_POST = [Client.MANAGE_POSTS, User.CREATE_POST];
exports.EDIT_POST = [Client.MANAGE_POSTS, User.EDIT_POST];
...
exports.CREATE_ACCOUNT = Client.MANAGE_USERS;
```


And finally you set your routes:

```js
var app = express();

var permission = require('permission-middleware');
var AppPermission = require('./permission');

app.post(permission(AppPermission.CREATE_POST), '/post', function () { ... });
app.get(permission(AppPermission.READ_POST), '/post/:id', function () { ... });
```