const Signal = require('signals')
const Vec2 = require('pex-math/Vec2')

// Space is head-less infinite canvas data model / ui interaction implementation
function createSpace (w, h) {
  const space = {
    size: [w, h],
    offset: [w / 2, h / 2],
    scale: 1,
    items: [],
    clickPos: [0, 0],
    prevPos: [0, 0],
    clickTime: 0,
    prevOffset: [0, 0], // offset before at mouse down moment
    changed: new Signal(),
    dragging: false
  }

  // On mouse down the following scenarios can occur
  // A: we hit an item. That might start dragging or changing selection
  // depending on key modifiers TODO: item selection
  // B: if we dont' hit anything we can start drawing selection rect
  // TODO: selection rect
  // C: otherwise we will start dragging the canvas by flipping dragging mode
  // flag, remembering old position, click position and taking scale level
  // into consideration
  // D: if tap occured quicly after the previous one we might enter
  // one finger zoom mode TODO: implement tap scale
  space.down = (x, y) => {
    console.log('down', x, y)
    const pos = [x, y]

    // we will enable one finger zoom on fast double click and drag
    const timeSinceLastClick = Date.now() - space.clickTime
    const distanceFromLastClick = Vec2.distance(pos, space.clickPos)
    console.log('down since', timeSinceLastClick, distanceFromLastClick)
    if (timeSinceLastClick < 500 && distanceFromLastClick < space.size[0] / 10) {
      space.zooming = true
    } else {
      space.dragging = true
    }
    Vec2.set(space.prevOffset, space.offset)
    Vec2.set(space.clickPos, pos)
    Vec2.set(space.prevPos, pos)
    space.clickTime = Date.now()
  }

  space.move = (x, y) => {
    const pos = [x, y]
    if (space.dragging) {
      const delta = Vec2.sub(Vec2.copy(pos), space.clickPos)
      Vec2.scale(delta, 1 / space.scale)
      Vec2.set(space.offset, space.prevOffset)
      Vec2.add(space.offset, delta)

      space.changed.dispatch(space)
    }
    if (space.zooming) {
      const delta = Vec2.sub(Vec2.copy(pos), space.prevPos)
      space.scroll(space.clickPos[0], space.clickPos[1], -delta[1])
      space.changed.dispatch(space)
    }
    Vec2.set(space.prevPos, pos)
  }

  space.up = () => {
    console.log('up')
    space.dragging = false
    space.zooming = false

    space.changed.dispatch(space)
  }

  // We want scroll to zoom toward the point under the mouse
  space.scroll = (x, y, dy) => {
    console.log('scroll dy', dy)
    const mousePos = [x, y]
    console.log('mousePos', mousePos)

    // First calculate the mouse pos in the space coords
    const zoomPoint = space.fromScreenCoords(mousePos)
    console.log('zoomPoint', zoomPoint)

    // Then zoom in
    // We connect zoom scroll sensitivity to the window size
    // and multiply zoom by around 0.99 .. 1.01 so it works
    // independently of zoom level
    const zoomScale = Math.min(space.size[0], space.size[1]) / 2
    if (dy > 0) space.scale *= 1.0 + dy / zoomScale
    else space.scale *= 1.0 + dy / zoomScale

    // Calculate new screen space position of the old mouse pos
    const driftedMousePos = space.toScreenCoords(zoomPoint)
    console.log('driftedMousePos', driftedMousePos)

    // Subtract from current mouse pos
    const delta = Vec2.sub(Vec2.copy(driftedMousePos), mousePos)
    console.log('delta', delta)

    // Covert data back to space coords
    Vec2.scale(delta, 1 / space.scale)

    // Subtract from space offset to cancel out the drift
    Vec2.sub(space.offset, delta)

    space.changed.dispatch(space)
  }

  space.fromScreenCoords = (pos) => {
    const spacePos = Vec2.copy(pos)
    Vec2.scale(spacePos, 1 / space.scale)
    Vec2.sub(spacePos, space.offset)
    return spacePos
  }

  space.toScreenCoords = (pos) => {
    const screenPos = Vec2.copy(pos)
    Vec2.add(screenPos, space.offset)
    Vec2.scale(screenPos, space.scale)
    return screenPos
  }

  setTimeout(() => {
    space.changed.dispatch(this)
  }, 1)

  return space
}

// init -----------------------------------------------------------------------

// Let's create a space that spans whole window rendered via HTML canvas
// For now we will display items as rectangles at positions [x, y] and size [w, h]
let W = window.innerWidth
let H = window.innerHeight

const space = createSpace(W, H)
space.items.push({
  position: [10, 10],
  size: [100, 50],
  background: '#FF0000'
})

space.items.push({
  position: [-50, -100],
  size: [100, 50],
  background: '#FFFF00'
})

space.items.push({
  position: [-300, -300],
  size: [600, 600],
  border: '#0000FF'
})

space.items.push({
  position: [-5000, -5000],
  size: [10000, 10000],
  border: '#FFFFFF'
})

space.items.push({
  position: [-10, -0.2],
  size: [20, 0.4],
  border: '#00FFFF'
})

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
canvas.width = W
canvas.height = H
document.body.appendChild(canvas)
document.body.style.padding = 0
document.body.style.margin = 0

// rendering ------------------------------------------------------------------

function redraw() {
  // Space is a void with dark background
  ctx.fillStyle = '#333'
  ctx.fillRect(0, 0, W, H)

  // Let's add coorinate system axis centered on the screen by default
  ctx.strokeStyle = '#EEE'
  ctx.beginPath()
  const scale = space.scale
  const dx = space.offset[0] * scale
  const dy = space.offset[1] * scale
  ctx.moveTo(0, dy)
  ctx.lineTo(W, dy)
  ctx.moveTo(dx, 0)
  ctx.lineTo(dx, H)
  ctx.stroke()
  ctx.fillStyle = '#EEE'
  ctx.fillRect(dx - 5 * scale, dy - 5 * scale, 10 * scale, 10 * scale )

  space.items.forEach((item) => {
    const x = dx + item.position[0] * scale
    const y = dy + item.position[1] * scale
    const w = item.size[0] * scale
    const h = item.size[1] * scale
    if (item.background) {
      ctx.fillStyle = item.background
      ctx.fillRect(x, y, w, h)
    } else if (item.border) {
      ctx.strokeStyle = item.border
      ctx.strokeRect(x, y, w, h)
    }
  })
}

// input events ---------------------------------------------------------------

// TODO: add window resize handler e.g. for mobile rotation

function onMouseDown (e) {
  space.down(
    e.offsetX || e.clientX || (e.touches ? e.touches[0].clientX : 0),
    e.offsetY || e.clientY || (e.touches ? e.touches[0].clientY : 0),
    e.shiftKey || (e.touches && e.touches.length === 2)
  )
}

function onMouseMove (e) {
  space.move(
    e.offsetX || e.clientX || (e.touches ? e.touches[0].clientX : 0),
    e.offsetY || e.clientY || (e.touches ? e.touches[0].clientY : 0),
    e.shiftKey || (e.touches && e.touches.length === 2)
  )
}

function onMouseUp (e) {
  space.up()
}

function onWheel (e) {
  space.scroll(
    e.offsetX || e.clientX || (e.touches ? e.touches[0].clientX : 0),
    e.offsetY || e.clientY || (e.touches ? e.touches[0].clientY : 0),
    e.deltaY
  )
  e.preventDefault()
}


// Currently this is a bit messy if the canvas is smaller than the window
// and not at 0,0 because in onMouseMove the e.offsetX will be
// relatively to the window not canvas
canvas.addEventListener('mousedown', onMouseDown)
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault()
  onMouseDown(e)
})
window.addEventListener('mousemove', onMouseMove)
window.addEventListener('touchmove', onMouseMove)
window.addEventListener('mouseup', onMouseUp)
window.addEventListener('touchend', onMouseUp)
canvas.addEventListener('wheel', onWheel)

space.changed.add(redraw)

