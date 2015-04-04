permission-middleware [ ![Codeship Status for mkretschek/permission-middleware](https://codeship.com/projects/4dff5200-7080-0132-b4f6-465f6b223ee2/status?branch=v0)](https://codeship.com/projects/54523)
=====================

[![NPM version](https://badge.fury.io/js/permission-middleware.svg)](http://badge.fury.io/js/permission-middleware)
[![Coverage Status](https://coveralls.io/repos/mkretschek/permission-middleware/badge.svg?branch=v0)](https://coveralls.io/r/mkretschek/permission-middleware?branch=v0)

A simple permissions middleware for Express applications which helps you
to define and organize your application's access permissions.

This will, however, make no assumptions about how to store, retrieve and
associate those permissions to a given target (user, client, app, etc.).


## Installation

As usual:

```
npm install permission-middleware --save
```

## Usage

`permission-middleware` works with 3 fundamental components to handle
permissions:

* **permission types**: used to create permission instances (see below). Every
    permission type must know how to get a permission set (from the request)
    for the agent trying to access the URI.
    
* **permission instances**: defines a permission, knows how to test a
    a request to see if the agent is allowed to access the requested resource.
    
* **permission sets**: a set of permissions a specific agent has;

### Permission types

Permission types are subclasses of the `Permission` class. To create a new
type you may use `Permission.create()` or just create a new class that
inherits from `Permission` using your inheritance method of choice.

> **NOTE:** `Permission.create()` is aliased as a middleware property for
> easy access:
>
> ```js
> var permission = require('permission-middleware');
> assert.equal(permission.create, permission.Permission.create);
> ```

It's usually a good idea to create one type for each **agent** that can
perform actions on your system (such as users, applications, services, etc).

```js
var Permission = require('permission-middleware').Permission;

var UserPermission = Permission.create(function (req) {
  // Return the permission set for the current user (assumes `req.user`
  // will be set already). The permission set tells which permissions the
  // user has. See more about permission sets below.
  return req.user && req.user.permissions;
});
```

> **NOTE:** `Permission` **must** be subclassed as it doesn't know how to
> retrieve a permission set from the request.

### Permission instances

They define a specific permission and how to test a request to see if the
involved agents have permission to access its underlying resources.

```js
var permissions = {
  // Code 1 and NOT allowed by default  
  CREATE:   new UserPermission(1, false),
  
  // Code 2 and allowed by default
  READ:     new UserPermission(2, true),
  
  // Code 3 and NOT allowed by default
  UPDATE:   new UserPermission(3, false),
  
  // Code 4 and NOT allowed by default
  DELETE:   new UserPermission(4, false)
};
```

> **NOTE:** permission codes **must** be unique, i.e. you cannot have two
> permissions with the same code (even if they have different types).

The examples above do a very simple verification. If no verification
function is provided, the middleware will just check if the permission
is listed in the permission set retrieved from the request. If you need
more complex permissions (i.e. checking if the user is allowed to read a
specific post), you can pass a verification function when creating the
permission:


```js
permissions.Post = {
  READ:     new UserPermission(5, false, function (req) {
    var post = req.post;
    // A user can read a post if...
    return post.public ||                             // ...the post is public
      post.owner === req.user.id ||                   // ...he owns it
      post.colaborators.indexOf(req.user.id) !== -1;  // ...he contributes to it
  }),
  
  DELETE:   new UserPermission(6, false, function (req) {
    var post = req.post;
    return req.user.isAdmin || post.owner = req.user.id;
  }),
  
  ...
};
```

### Permission sets

Permission sets define the permissions an agent has. An **agent** can be any
entity able to perform actions on the system, such as a user, a client or
application, another service, etc...

A permission set is just a map binding permission codes to a boolean indicating
whether the permission is granted or not:

```json
{
    1 : true,   // Grants the CREATE permission
    2 : false,  // Revokes the READ permission
    5 : true    // Grants the READ Post permission
}
```

> **NOTE:** keep in mind that, if the user does not have a permission
> explicitly set in the permission set, it will get the default value for
> that permission (as defined by the permission instance).

The permission types should know how to retrieve those sets from the request
object, extracting them from a user, application or any other agent to whom
the permission is applied.




### Example

Here goes a complete example of how to set permissions to read, write and
delete posts from a blog. First we define the permission types:

```js
var express = require('express');
var permission = require('permission-middleware');

var UserPermission = permission.create(function (req) {
  return req.user && req.user.permissions || {};
});

var ClientPermission = permission.create(function (req) {
  return req.client && req.client.permissions || {};
});

var PostPermission = permission.create(function (req) {
  var post = req.post;
  var user = req.user;
  
  return post && user && post.permissions[user.id] || {};
});
```

Then we define the permissions themselves:

```js
var permissions = {};

// Basic user permissions
permissions.User = {
  READ:   new UserPermission(11, true),
  WRITE:  new UserPermission(12, false),
  DELETE: new UserPermission(13, false)
};


// Basic client permissions
permissions.Client = {
  READ:   new ClientPermission(21, true),
  WRITE:  new ClientPermission(22, true),
  DELETE: new ClientPermission(23, true)
};


// Slightly more complex post-specific permissions
permissions.Post = {
  READ:   new PostPermission(31, false, function (req) {
    var post = req.post;
    var user = req.user;
    
    return post && (
      (post.public && post.published) ||
      post.author === user.id ||
      post.contributors.indexOf(user.id) !== -1
    );
  }),
  
  EDIT:  new PostPermission(32, false, function (req) {
    var post = req.post;
    var user = req.user;
    return post.owner === user.id || post.contributors.indexOf(user.id);
  }),
  
  DELETE: new PostPermission(33, false, function (req) {
    var post = req.post;
    var user = req.user;
    return post && user && (post.owner === user.id || user.admin);
  })
};


// Composite permissions (combine multiple permissions)
var READ_POST = permission.all(
  permissions.Client.READ,
  permissions.User.READ,
  permissions.Post.READ
);

var CREATE_POST = permission.all(
  permissions.Client.WRITE,
  permissions.User.WRITE
);

var EDIT_POST = permission.all(
  permissions.Client.WRITE,
  permissions.User.WRITE,
  permissions.Post.EDIT
);

var DELETE_POST = permission.all(
  permissions.Client.DELETE,
  permissions.User.DELETE,
  permissions.Post.DELETE
);
```

Before we can use these permissions, we must define some middlewares that
insert the data we need in the request, such as `client`, `user` and `post`
data:

```js
function setUser(req, res, next) {
  if (req.query.userId) {
    req.user = getUser(req.query.userId);
  }
  next();
}

function setClient(req, res, next) {
  if (req.header.accessToken) {
    req.client = getClient(req.header.accessToken);
    if (req.client) {
      next();
    } else {
      res.sendStatus(400); // BAD REQUEST
    }
  }
}


var app = express();

app
  .use(setClient)
  .use(setUser)
  .param('postSlug', function (req, res, next, slug) {
    req.post = getPost(slug);
    if (req.post) {
      next();
    } else {
      res.sendStatus(404); // NOT FOUND
    }
  });
```

And, finally, we use our permissions with the `permission` middleware:

```js
app
  .post('/post', permission(CREATE_POST), function (req, res) {
    createPost(req.body);
    res.sendStatus(200);
  });
  
app.route('/post/:postSlug')
  .get(permission(READ_POST), function (req, res) {
    // At this point we know the post exists and the current user and client
    // are authorized to read it...
    res.send(req.post);
  })
  
  .put(permission(EDIT_POST), function (req, res) {
    updatePost(req.body);
    res.sendStatus(200);
  })
  
  .del(permission(DELETE_POST), function (req, res) {
    deletePost(req.post.id);
    res.sendStatus(200);
  });
```


## Contributing

Feel free to submit pull requests for this project. It may take some days
for me to review them, but I'll do that.


## License

This project is released under the MIT license.