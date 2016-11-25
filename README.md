# state-dispatch

Send messages to change state.

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
var xhr = require('xhr')

var dispatcher = stateDispatch({
  state: { count: 0 },
  initialize: function (send, done) {
    setInterval(function () {
      send('getAmount')
    }, 1000)
    done()
  },
  actions: {
    getAmount: function (state, data, send, done) {
      xhr({ url: '/data.json', json: true }, function (err, res, body) {
        send('increase', body.amount, done)
      })
    }
  },
  reducers: {
    increase: function (state, data) {
      state.count += data
      return state
    }
  },
  update: function (state, prev, send) {
    console.log('state', state)
    console.log('prev', prev)
  }
})

dispatcher.start()
```

## About

Taking inspiration from [redux](https://npmjs.com/redux), [barracks](https://npmjs.com/barracks), [send-action](https://npmjs.com/send-action), [elm](http://elm-lang.org), and others, state-dispatch is a variant on unidirectional state management.

The goal is to be simpler than barracks but with better async & logging support than send-action.

With state-dispatch there are terms and concepts that are similar to approaches found in elm, redux, and choo. But things are a little bit different.

There are a few concepts to look at:

- **[send](#messages--send)** – the `send` function sends `messages` to trigger state changes
- **[messages](#messages--send)** – a message has a `name` and optionally some `data` and is sent with the `send` function. a message can trigger a `reducer` or `action`
- **[state](#state)** – the global state object is only modified using `reducers`
- **[reducers](#reducers)** – perform state changes. must be synchronous.
- **[actions](#actions)** – perform async work inside `actions` that then use `send` to make state changes with reducers
- **[initialize](#initialize)** – the `initialize` function is called when `dispatcher.start` is called and has access to the `send` function
- **[update](#update)** – the `update` function is where we use state changes to rerender the UI of the app
- **[hooks](#hooks)** – the global state has hooks available for logging and storage purposes.

## Messages & `send`

Messages are more of a concept in state-dispatch than a specific piece of code. A message is similar to an event in an event emitter.

Messages are sent using the `send` function. Sending a message triggers a `reducer` or and `action`.

A message has a `name` and optionally some kind of `data`.

The `name` of a message is a string, and refers to the name of a reducer or action.

The second argument is the `data`, and can be a string, number, array, or object. The `data` argument is optional.

The `send` function is accessible in three places:

### 1. The return value of `dispatcher.start()`:

```js
var send = dispatcher.start()
send('example' { example: true })
```

### 2. As the first argument of the `initialize` function:

```js
stateDispatch({
  state: {}
  initialize: function (send, done) {
    send('example', { example: true }, done)
  }
})
```

### 3. As the third argument of an action:

```js
stateDispatch({
  state: {}
  actions: {
    apiGet: function (state, data, send, done) {
      api.get('data', function (err, data) {
        if (err) return send('error', err)
        send('data', data, done)
      })
    }
  }
}) 
```

## state

The state object can be any arbitrary data.

## Reducers

Reducers are similar to reducers in redux & choo.

A reducer is a function with two arguments: `state` & `data`.

#### state
The `state` argument is the current internal state of the dispatcher. This is a copy of the dispatcher's internal state, so changing this object does not update the state directly. It's possible to make changes to this object and return it to effectively update the state. The object returned by a reducer is then used to extend the internal state object of the dispatcher.

#### data
The `data` argument is the incoming data of the message used to update the state.

## Actions

In state-dispatch actions are for performing asynchronous tasks like fetching data from an API server.

An action is a function with four arguments: `state`, `data`, `send`, `done`.

#### state
The `state` argument is the current internal state of the dispatcher. This is a copy of the internal state object, so changing this object does not update the state directly.

#### data
The `data` argument is the incoming data sent by the message that triggered the action.

#### send
The `send` argument is a function that you can use to send additional messages to trigger other actions. Using the `send` function is optional.

#### done

Call the `done` function when the asynchronous task is complete.

#### actions example

Here's an example making an API request:

```js
function getExample (state, data, save, send) {
  apiClient.get('/example', function (err, res, body) {
    if (err) return send('error', err)
    send('exampleResponse', body, done)
  })
}
```

Note that `done` is passed in as the last argument to `send`. This is a convenient shorthand for calling the done function.

These two usages are equivalent:

```js
send('exampleResponse', body, done)
```

```js
send('exampleResponse', body)
done()
```

## Initialize

The initialize function is called once after calling `state.start()`. The function is two arguments the `send` function, and a `done` function.

Similar to actions, the `done` function is used to indicate that any async tasks have completed, and can be passed in as the third argument to `send`.

This lets us create ongoing processes like websockets, make an initial call to an API, or set up an event listener to handle events like clicks or keypresses.

Here's an example based on setting up an event listener:

```js
stateDispatch({
  state: {
    list: [],
    clicks: 0
  },
  initialize: function (send, done) {
    document.body.addEventListener('click', function (e) {
      send('click', done)
    })
  },
  reducers: {
    click: function (state, data, save) {
      state.clicks++
      return state
    }
  }
})
```

### Update

The `update` function is where we listen for changes to state, and rerender the UI of the app.

Here's an example showing usage with [yo-yo](https://npmjs.org/yo-yo):

```js

```

### Hooks

These hooks are available:

- `beforeStart`
- `afterStart`
- `beforeSend`
- `beforeAction`
- `afterAction`
- `beforeStateChange`
- `afterStateChange`

An example with all hooks:

```js
var hooks = {
  beforeStart: function (state) {
    console.log(state)
  },
  afterStart: function (state) {
    console.log(state)
  },
  beforeSend: function (name, data, state) {
    console.log(name, data, state)
  },
  beforeAction: function (name, data, state) {
    console.log(name, data, state)
  },
  afterAction: function (name, data, state, prev) {
    console.log(name, data, state, prev)
  },
  beforeStateChange: function (name, data, state) {
    console.log(name, data, state)
  },
  afterStateChange: function (name, data, state, prev) {
    console.log(name, data, state, prev)
  }
}

var dispatcher = stateDispatch({
  hooks: hooks,
  state: {},
  reducers: {},
  actions: {},
  initialize: {},
  update: function (state, prev, send) {}
})
```

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
