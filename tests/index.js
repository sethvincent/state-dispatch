var test = require('tape')

var stateDispatch = require('../index')

test('set a model and send an action', function (t) {
  t.plan(2)
  var state = stateDispatch({
    stateChange: function (state, prev) {
      t.ok(state.example.example)
      t.ok(prev.example)
    }
  })

  state.model({
    namespace: 'example',
    state: {},
    initialize: function (send) {
      send('example:example')
    },
    actions: {
      example: function (state, data, save, send) {
        save({ example: true })
      }
    }
  })

  state.start()
})

test('set a model without a namespace', function (t) {
  t.plan(2)
  var state = stateDispatch({
    stateChange: function (state, prev) {
      t.ok(state.example)
      t.notOk(prev.example)
    }
  })

  state.model({
    state: {},
    initialize: function (send) {
      send('example')
    },
    actions: {
      example: function (state, data, save, send) {
        save({ example: true })
      }
    }
  })

  state.start()
})

test('trigger actions within an action', function (t) {
  t.plan(3)

  var state = stateDispatch({
    stateChange: function (state, prev, name) {
      if (name === 'example:hi') {
        t.ok(state.example.example)
        t.ok(state.example.hello)
        t.ok(state.example.hi)
      }
    }
  })

  state.model({
    namespace: 'example',
    state: {},
    initialize: function (send) {
      send('example:example')
    },
    actions: {
      example: function (state, data, save, send) {
        send('example:hello')
        send('example:hi')
        save({ example: true })
      },
      hello: function (state, data, save, send) {
        save({ hello: true })
      },
      hi: function (state, data, save, send) {
        save({ hi: true })
      }
    }
  })

  state.start()
})

test('pass save to send', function (t) {
  t.plan(1)

  var state = stateDispatch({
    stateChange: function (state, prev, name) {
      if (name === 'example:hello') {
        t.ok(state.example.hello)
      }
    }
  })

  state.model({
    namespace: 'example',
    state: {},
    initialize: function (send) {
      send('example:example')
    },
    actions: {
      example: function (state, data, save, send) {
        send('example:hello', save)
      },
      hello: function (state, data, save, send) {
        save({ hello: true })
      }
    }
  })

  state.start()
})
