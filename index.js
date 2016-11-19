var assert = require('assert')
var xtend = require('xtend')

module.exports = function stateDispatch (hooks) {
  hooks = hooks || {}
  assert.equal(typeof hooks, 'object', 'state-dispatch: hooks argument must be an object')

  var beforeStartHook = hooks.beforeStart || noop
  var beforeActionHook = hooks.beforeAction || noop
  var stateChangeHook = hooks.stateChange || noop

  var state = {}
  var actions = {}
  var initializers = []

  function setModel (model) {
    assert.equal(typeof model, 'object', 'state-dispatch model: model object is required')
    if (model.namespace) var namespace = model.namespace
    if (model.initialize) initializers.push(model.initialize)
  
    if (model.state) {
      if (namespace) state[namespace] = model.state
      else state = xtend(state, model.state)
    }

    if (model.actions) {
      var keys = Object.keys(model.actions)
      var i = 0
      var l = keys.length

      for (i; i < l; i++) {
        var actionKey = namespace ? namespace + ':' + keys[i] : keys[i]
        var action = model.actions[keys[i]]
        actions[actionKey] = action
      }
    }
  }

  function start () {
    beforeStartHook(state, createSave())

    var i = 0
    var l = initializers.length

    for (i; i < l; i++) {
      initializers[i](send)
    }
  }

  function createSave (name) {
    return function save (newState) {
      if (!newState) return

      var prevState = xtend({}, state)

      if (name.indexOf(':') > 0) {
        var namespace = name.split(':')[0]
        assert.ok(state[namespace], 'namespace ' + namespace + ' not found in state')
        state[namespace] = xtend(state[namespace], newState)
      } else {
        state = xtend(state, newState)
      }

      stateChangeHook(state, prevState, name)
    }
  }

  function send (name, data, done) {
    setTimeout(function () {
      beforeActionHook(name, data, state)

      if (actions[name]) {
        var sendState = xtend({}, state)
        actions[name](state, data, createSave(name), send)
      } else {
        // TODO: action not found error
      }

      if (done) done()
    }, 0)
  }

  start.model = setModel
  start.start = start
  return start
}

function noop () {}
