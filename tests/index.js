var test = require('tape')
var stateDispatch = require('../index')

test('create a dispatcher and update state from initialize function', function (t) {
  t.plan(2)

  var dispatcher = stateDispatch({
    state: { example: false },
    initialize: function (send, done) {
      send('example', true, done)
    },
    reducers: {
      example: function (state, data) {
        return { example: data }
      }
    },
    update: function (state, prev) {
      t.ok(state.example)
      t.notOk(prev.example)
    }
  })

  dispatcher.start()
})

test('create a dispatcher and update state from initialize function', function (t) {
  var hooks = {
    beforeStart: function (state) {
      t.notOk(state.init)
      t.notOk(state.example)
      t.notOk(state.done)
    },
    afterStart: function (state) {
      t.ok(state.init)
      t.ok(state.example)
      t.ok(state.done)
    },
    beforeSend: function (name, data, state) {
      t.ok(name)
      t.ok(data)
      t.ok(state)
    },
    beforeAction: function (name, data, state) {
      t.ok(name)
      t.ok(data)
      t.ok(state)
    },
    afterAction: function (name, data, state, prev) {
      t.ok(name)
      t.ok(data)
      t.ok(state)
      t.ok(prev)
    },
    beforeStateChange: function (name, data, state) {
      t.ok(name)
      t.ok(data)
      t.ok(state)
    },
    afterStateChange: function (name, data, state, prev) {
      t.ok(name)
      t.ok(data)
      t.ok(state)
      t.ok(prev)
    }
  }

  var dispatcher = stateDispatch({
    hooks: hooks,
    state: {},
    initialize: function (send, done) {
      send('init', true, function () {
        send('async', true, function () {
          send('done', true, done)
        })
      })
    },
    actions: {
      async: function (state, data, send, done) {
        setTimeout(function () {
          send('example', true, done)
        }, 10)
      }
    },
    reducers: {
      init: function (state, data) {
        return { init: data }
      },
      example: function (state, data) {
        return { example: data }
      },
      done: function (state, data) {
        return { done: data }
      }
    },
    update: function (state, prev) {
      if (state.init && state.example && state.done) {
        t.end()
      }
    }
  })

  dispatcher.start()
})
