const css = require('sheetify')
const createSpace = require('./space')
const registerEvents = require('./events')

css('tachyons')

// Space is head-less infinite canvas data model / ui interaction implementation
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

space.items.push({
  position: [-2000, -2000],
  size: [0, 0],
  scale: 1.1,
  image: 'assets/cover.jpg'
})

space.items.push({
  position: [500, -3000],
  size: [0, 0],
  scale: 1.15,
  image: 'assets/example-draw.jpg'
})

space.items.push({
  position: [3500, -1500],
  size: [0, 0],
  scale: 1.12,
  image: 'assets/reaction-diffusion.jpg'
})

space.items.forEach((item) => {
  if (item.image) {
    const img = new window.Image()
    img.onload = function () {
      item.size = [img.width, img.height]
      item.rect = [item.position, [item.position[0] + item.size[0] * item.scale, item.position[1] + item.size[1] * item.scale]]
    }
    img.src = item.image
    item.image = img
  }
  item.scale = item.scale || 1
  item.rect = [item.position, [item.position[0] + item.size[0] * item.scale, item.position[1] + item.size[1] * item.scale]]
})

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
canvas.width = W
canvas.height = H
document.body.appendChild(canvas)

// rendering ------------------------------------------------------------------

function redraw () {
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
  ctx.fillRect(dx - 5 * scale, dy - 5 * scale, 10 * scale, 10 * scale)

  space.items.forEach((item) => {
    const x = dx + item.position[0] * scale
    const y = dy + item.position[1] * scale
    if (item.background) {
      const w = item.size[0] * scale
      const h = item.size[1] * scale
      ctx.fillStyle = item.background
      ctx.fillRect(x, y, w, h)
    }
    if (item.image && item.image.width) {
      const w = item.image.width * item.scale * scale
      const h = item.image.height * item.scale * scale
      ctx.drawImage(item.image, x, y, w, h)
    }
    if (item.border || item.hover) {
      const w = item.size[0] * scale * item.scale
      const h = item.size[1] * scale * item.scale
      ctx.strokeStyle = item.hover ? '#FF0000' : item.border
      ctx.strokeRect(x, y, w, h)
    }
    ctx.strokeStyle = '#00FF00'
    const from = space.toScreenCoords(item.rect[0])
    const to = space.toScreenCoords(item.rect[1])
    ctx.strokeRect(from[0] - 2, from[1] - 2, to[0] - from[0] + 4, to[1] - from[1] + 4)
  })

  // if (touches) {
    // ctx.fillStyle = '#FFF'
    // touches.forEach((touch, i) => {
      // ctx.fillText(`${i} : ${touch.x} ${touch.y}`, 20, 20 + 10 * i)
    // })
    // ctx.fillText(`${space.panning ? 'panning' : ''}`, 20, 20 + 10 * (touches.length + 1))
    // ctx.fillText(`${space.oneFingerZooming ? 'oneFingerZooming' : ''}`, 20, 20 + 10 * (touches.length + 2))
    // ctx.fillText(`${space.pinchZooming ? 'pinchZooming' : ''}`, 20, 20 + 10 * (touches.length + 3))
  // }
}

// input events ---------------------------------------------------------------


registerEvents(canvas, space)
space.changed.add(redraw)
