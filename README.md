sinew
=====

A simple module for enforcing the new keyword and privatizing object methods using the revelation pattern

`npm install sinew`

You can use sinew to enforce the new keyword:

```coffeescript
sinew = new require('sinew')()

TestObject = ()->
    self = sinew.forceNew @, TestObject
    self.someMethod = ()->
    return self

```

Now if you forget the `new` keyword:

```coffeescript
t = TestObject()
```

is the equivalent of

```coffeescript
t = new TestObject()
```

You can also use sinew to use the revelation / revealing pattern.

By default it will create a wrapped object that omits any methods that begin with an underscore '_' character.

```coffeescript
sinew = new require('sinew')()

TestObject = ()->
    self = sinew.forceNew @, TestObject
    self.publicMethod = ()->
    self._privateMethod = ()->
    self._construct = ()->
        return sinew.create self, TestObject
    return self._construct()

t = TestObject()

_ = require 'lodash'
console.log(_.keys(t)) # should list publicMethod only
```

You can customize the filtering behavior by setting it as a property during instantiation.

(The filter function expects a function signature which takes a string and returns a boolean.)

```coffeescript
sinew = new require('sinew')({
    filter: (x)->
        return (x.indexOf('private') is -1)
})
```
