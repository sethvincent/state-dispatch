var html = require('yo-yo')
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
    render(state, prev, send)
  }
})

var send = dispatcher.start()
var state = dispatcher.state()
var app = main(state, {}, send)
document.body.appendChild(app)

function render (state, prev, send) {
  var tree = main(state, prev, send)
  html.update(app, tree)
}

function main (state, prev, send) {
  return html`<div>
    <p>count: ${state.count}</p>
  </div>`
}
