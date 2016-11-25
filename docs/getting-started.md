# Getting started with state-dispatch

A basic usage example:

```js
var xhr = require('xhr')
var stateDispatch = require('state-dispatch')

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
        if (err) return send('error', err)
        send('increase', body.amount, done)
      })
    }
  },
  reducers: {
    error: function (state, data) {
      state.error = data
      return state
    },
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