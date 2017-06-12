function render (ctx, space) {
  const W = ctx.canvas.width
  const H = ctx.canvas.height
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

module.exports = render
