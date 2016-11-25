var assert = require('assert')
var xtend = require('xtend')

/**


**/
module.exports = function stateDispatch (options) {
  options = options || {}
  var hooks = options.hooks || {}
  var update = options.update

  assert.equal(typeof options, 'object', 'state-dispatch: options object is required')
  assert.equal(typeof hooks, 'object', 'state-dispatch: options.hooks must be an object')
  assert.equal(typeof update, 'function', 'state-dispatch', 'options.update function is required')

  var beforeStartHook = hooks.beforeStart || noop
  var afterStartHook = hooks.afterStart || noop
  var beforeSendHook = hooks.beforeSend || noop
  var beforeActionHook = hooks.beforeAction || noop
  var afterActionHook = hooks.afterAction || noop
  var beforeStateChangeHook = hooks.beforeStateChange || noop
  var afterStateChangeHook = hooks.afterStateChange || noop

  var state = options.state || {}
  var actions = options.actions || {}
  var reducers = options.reducers || {}
  var initialize = options.initialize

  function start (opts) {
    beforeStartHook(state)

    if (initialize) {
      initialize(send, function () {
        afterStartHook(state)
      })
    } else {
      afterStartHook(state)
    }

    return send
  }

  function getState () {
    return state
  }

  function send (name, data, done) {
    setTimeout(function () {
      var prev = xtend({}, state)
      beforeSendHook(name, data, prev)

      var reducer = reducers[name]
      var action = actions[name]

      assert.equal(!!(reducer || action), true, 'no reducer or action found with name ' + name)
      assert.notEqual(!!(reducer && action), true, 'reducer and action names must be unique: ' + name + ' found in both actions and reducers')

      if (reducer) {
        var changes = reducer(state, data)

        if (changes) {
          beforeStateChangeHook(name, data, prev)
          state = xtend(state, changes)
          afterStateChangeHook(name, data, state, prev)
          update(state, prev, send)
          if (done) done()
        }
      } else if (action) {
        beforeActionHook(name, data, prev)
        action(state, data, send, function () {
          afterActionHook(name, data, state, prev)
          if (done) done()
        })
      }
    }, 0)
  }

  start.start = start
  start.state = getState
  return start
}

function noop () {}
