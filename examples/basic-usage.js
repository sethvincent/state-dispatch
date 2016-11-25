var stateDispatch = require('../index')

var dispatcher = stateDispatch({
  state: { count: 0 },
  initialize: function (send, done) {
    setInterval(function () {
      send('increase', 1)
    }, 1000)
    done()
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
