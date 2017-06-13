const html = require('choo/html')
const choo = require('choo')

const app = choo()
app.use(model)
app.route('/', mainView)
app.mount('#ui')

function model (state, emitter) {
  state.count = 0
  state.tool = 'move'
  emitter.on('setTool', function (tool) {
    console.log('setTool', tool)
    state.tool = tool
    emitter.emit('render')
  })
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

function toolButton (state, onClick, icon, toolName, classes) {
  const bg = (state.tool === toolName) ? 'bg-red' : 'bg-gray'
  return html`<button onclick=${() => onClick(toolName)} class="${icon} grow mb1 br3 pa3 ba0 bn ${bg} ${classes}"></button>`
}

function mainView (state, emit) {
  return html`
    <div id="ui">
      <div class="fixed top-0 left-0 w-100 ${state.editing ? 'flex' : 'dn'}">
        <textarea class="flex-auto pv3 ph2 br0 bn" onblur=${onTextBlur} rows="10"></textarea>
      </div>
      <div class="fixed bottom-0 left-0 pa3 flex flex-column">
        ${toolButton(state, onDeleteButtonClick, 'ti-trash', 'delete', 'mb3')}
        ${toolButton(state, onToolButtonClick, 'ti-text', 'text')}
        ${toolButton(state, onToolButtonClick, 'ti-image', 'image')}
        ${toolButton(state, onToolButtonClick, 'ti-layout-width-full', 'rect')}
        ${toolButton(state, onToolButtonClick, 'ti-move', 'move')}
      </div>
    </div>
  `

  function onTextBlur () {
    emit('editing', false)
  }

  function onToolButtonClick (toolName) {
    console.log('onToolButtonClick', toolName)
    emit('setTool', toolName)
  }

  function onDeleteButtonClick () {
    emit('delete')
  }
}

module.exports = app
