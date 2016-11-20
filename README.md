# state-dispatch

Dispatch messages to manage state.

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]
[![standard][standard-image]][standard-url]
[![conduct][conduct]][conduct-url]

[npm-image]: https://img.shields.io/npm/v/state-dispatch.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/state-dispatch
[travis-image]: https://img.shields.io/travis/sethvincent/state-dispatch.svg?style=flat-square
[travis-url]: https://travis-ci.org/sethvincent/state-dispatch
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: http://npm.im/standard
[conduct]: https://img.shields.io/badge/code%20of%20conduct-contributor%20covenant-green.svg?style=flat-square
[conduct-url]: CONDUCT.md

## Install

```sh
npm install --save state-dispatch
```

## Work in progress

Currently this is just a sketch of an idea. The module works, but is it good? I guess we'll find out.

## Usage example

```js
var stateDispatch = require('state-dispatch')

var state = stateDispatch({
  stateChange: function (state, prev) {
    // render the application
  }
})

state.model({
  namespace: 'example',
  state: {
    list: [],
    clicks: 0
  },
  initialize: function (send) {
    document.body.addEventListener('click', function (e) {
      send('example:click')
    })
  },
  actions: {
    click: function (state, data, save, send) {
      state.clicks++
      save(state)
    }
  }
})

state.start()
```

## About

Taking inspiration from [redux](https://npmjs.com/redux), [barracks](https://npmjs.com/barracks), [send-action](https://npmjs.com/send-action), [elm](http://elm-lang.org), and others, state-dispatch is a variant on unidirectional state management.

The goal is to be simpler than barracks but with better async & logging support than send-action.

With state-dispatch you'll find some terms and concepts that are similar to approaches found in elm, redux, and choo. But things are a little bit different.

There are a few concepts to look at:

- **messages** – a message has a `name` and some `data`
- **models** – a model has a `namespace`, `state`, `actions`, and an `initialize` function
- **hooks** – the global state has hooks you can use for logging and storage purposes.

## Messages

Messages are more of a concept in state-dispatch than a specific piece of code. A message is similar to an event in an event emitter.

A message has a `name` and some kind of `data`. Messages are sent using the `send` function. Sending a message triggers an `action`.

The first argument of `send` is the `name`, and must be a string. The name of a message correlates to a model namespace and action name, in this format: `{model-namespace}:{action-name}`.

The second argument is the `data`, and can be a string, number, array, or object.

You get access to the `send` function in three places:

### 1. The return value of `state.start()`:

```js
var send = state.start()
send('app:example' { example: true })
```

### 2. As the only argument of the `initialize` function of a model:

```js
state.model({
  namespace: 'app',
  state: {}
  initialize: function (send) {
    send('app:example', { example: true })
  }
})
```

### 3. As the fourth argument of an action:

```js
state.model({
  namespace: 'app',
  state: {}
  actions: {
    example: function (state, data, save, send) {
      send('otherModel:example')
      state.example = data.example
      save(state)
    }
  }
}) 
```

## Models

Each model in the global state object has a `namespace`, a `state` object, an `initialize` function, and a set of `actions` that are responsible for updating the state.

### namespace

The namespace of a model must be a unique human-friendly string. Messages are prefixed with a model's namespace. The namespace is optional, though recommended.

Without a namespace, the model can access the entire global state across all models. It's useful to have one app-level model to handle global changes to the app, but keep the others namespaced.

When a model has a namespace, that namespace acts as a prefix for referencing the model's actions.

### state

The state object of a model can be any arbitrary data.

### initialize

The initialize function of each model is called once after calling `state.start()`. The function is passed one argument, the model's `send` function.

This lets us create ongoing processes like websockets, make an initial call to an API, or set up an event listener to handle events like clicks or keypresses.

Here's an example based on setting up an event listener:

```js
state.model({
  namespace: 'example',
  state: {
    list: [],
    clicks: 0
  },
  initialize: function (send) {
    document.body.addEventListener('click', function (e) {
      send('example:click')
    })
  },
  actions: {
    click: function (state, data, save) {
      state.clicks++
      save(state)
    }
  }
})
```

### actions

A model's actions can be considered similar to reducers in redux & choo, or commands/subscriptions in elm. If you're already familiar with redux, sorry about the naming mismatch. Check out the redux to state-dispatch migration guide for help.

An action is a function with four arguments: `state`, `data`, `save`, `send`.

#### state
The `state` argument is the current state of the model. This is a copy of the model's state, so changing this object does not update the state directly.

#### data
The `data` argument is the incoming data sent by the message that triggered the action.

#### save
The `save` argument is a callback. When you're ready, you update global state by calling `save(state)`. Using the `save` function is required in all actions.

#### send
The `send` argument is a function that you can use to send additional messages to trigger other actions. Using the `send` function is optional.

Here's a basic example using the `save` function:

```js
function example (state, data, save, send) {
  state.example = data
  save(state)
}
```

Behind the scenes, the model's state is extended with whatever you pass into `save`, so the above example is equivalent to this:

```js
function example (state, data, save, send) {
  save({ example: data })
}
```

Because we update state using the `save` callback, doing asynchronous operations is straightforward.

Here's an example making an api request:

```js
function example (state, data, save, send) {
  apiClient.get('example', function (err, res, body) {
    state.example = body
    save(state)
  })
}
```

You may find situations where you want to trigger other actions inside an action. You can do that by using the optional 4th argument `send` in the action:

```js
function get (state, data, save, send) {
  send('example:request-started')

  apiClient.get('example', function (err, res, body) {
    state.example = body
    send('example:request-finished')
    save(state)
  })
}
```

What if an error occurs?

Abort the action by sending a message that triggers another action in your app that handles errors:

```js
function get (state, data, save, send) {
  send('example:request-started')

  apiClient.get('example', function (err, res, body) {
    if (err) {
      return send('app:error', err, save)
    }
    state.example = body
    send('example:request-finished')
    save(state)
  })
}
```

Note that `save` is passed as the last argument to `send`. We do this because we don't want to update the state directly in this action, but still need to indicate to the model that the action has completed. `send` calls the save function without any state updates.

These two usages are equivalent:

```js
if (err) {
  return send('app:error', err, save)
}
```

```js
if (err) {
  send('app:error', err)
  return save()
}
```

Calling the `save` function without an argument tells the model to skip this action without updating the model's state. When this occurs, this action will not cause the app to re-render.

## Hooks

These hooks are available:

- `beforeStart`
- `beforeAction`
- `stateChange`

## Contributing

Contributions are welcome! Please read the [contributing guidelines](CONTRIBUTING.md) first.

## Conduct

It is important that this project contributes to a friendly, safe, and welcoming environment for all. Read this project's [code of conduct](CONDUCT.md)

## Changelog

Read about the changes to this project in [CHANGELOG.md](CHANGELOG.md). The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).

## Contact

- **issues** – Please open issues in the [issues queue](https://github.com/sethvincent/state-dispatch/issues)
- **twitter** – [@sethdvincent](https://twitter.com/sethdvincent)
- **email** – Need in-depth support via paid contract? Send an email to sethvincent@gmail.com

## License

[ISC](LICENSE.md)
