const html = require('choo/html')
const choo = require('choo')

const app = choo()
app.use(model)
app.route('/', mainView)
app.mount('#ui')

function model (state, emitter) {
  state.count = 0
  emitter.on('editing', function (editing) {
    state.editing = editing
    if (editing) {
      setTimeout(() => {
        document.querySelector('textarea').focus()
      }, 100)
    }
    emitter.emit('render')
  })
}

function mainView (state, emit) {
  return html`
    <div id="ui">
      <div class="fixed top-0 left-0 w-100 ${state.editing ? 'flex' : 'dn'}">
        <textarea class="flex-auto pv3 ph2 br0 bn" onblur=${onTextBlur} rows="10"></textarea>
      </div>
      <div class="fixed bottom-0 left-0 pa3">
        <button onclick=${onClick} class="br3 pa3 ba0 bn">E</button>
      </div>
    </div>
  `

  function onTextBlur() {
    emit('editing', false)
  }

  function onClick () {
    emit('editing', true)
  }
}
