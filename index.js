const css = require('sheetify')
const createSpace = require('./space')
const registerEvents = require('./events')
const items = require('./items')
const renderCanvas = require('./render')
const ui = require('./ui')

css('tachyons')
css('./fonts/themify-icons.css')

// Space is head-less infinite canvas data model / ui interaction implementation
// init -----------------------------------------------------------------------

// Let's create a space that spans whole window rendered via HTML canvas
// For now we will display items as rectangles at positions [x, y] and size [w, h]
let W = window.innerWidth
let H = window.innerHeight

const space = createSpace(W, H)
items.init(space)

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
canvas.width = W
canvas.height = H
document.body.appendChild(canvas)

registerEvents(canvas, space)

ui.use(function (state, emitter) {
  state.space = space
  space.changed.add(() => {
    renderCanvas(ctx, space)
  })

  emitter.on('delete', () => {
    space.deleteSelectedItems()
  })

  space.dblclick.add((e) => {
    if (e.selectedItems.length === 1) {
      const item = e.selectedItems[0]
      if (item.text !== undefined) {
        emitter.emit('editing', item)
      }
    }
  })

  space.click.add((e) => {
    if (state.tool === 'move') return

    if (!e.selectedItems.length) {
      const size = [200, 150]
      const pos = space.fromScreenCoords(e.position)
      const scale = 1 / space.scale
      pos[0] -= size[0] / 2 * scale
      pos[1] -= size[1] / 2 * scale
      const item = {
        position: pos,
        size: size,
        scale: scale
      }

      console.log(state.tool)
      switch (state.tool) {
        case 'text':
          console.log('add text')
          item.background = 'rgba(255, 255, 255, 0.1)'
          item.text = 'Empty text...'
          break
        case 'rect':
          item.background = '#3AA68E'
          break
        case 'image':
          item.image = null
          break
        default:
          throw new Error(`No onClick action defined for ${state.tool} tool`)
      }
      console.log(
        space.addItem(item)
      )
    }
  })
})
