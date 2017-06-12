const css = require('sheetify')
const createSpace = require('./space')
const registerEvents = require('./events')
const items = require('./items')
const renderCanvas = require('./render')

css('tachyons')

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
space.changed.add(() => {
  renderCanvas(ctx, space)
})
