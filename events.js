let touches = []

function registerEvents (canvas, space) {
  // TODO: add window resize handler e.g. for mobile rotation

  function onMouseDown (e) {
    touches = !e.touches ? null : Array.prototype.slice.call(e.touches).map((touch) => {
      return {
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier
      }
    })
    space.down(
      e.offsetX || e.clientX || (e.touches ? e.touches[0].clientX : 0),
      e.offsetY || e.clientY || (e.touches ? e.touches[0].clientY : 0),
      e.shiftKey || (e.touches && e.touches.length === 2),
      touches
    )
  }

  function onMouseMove (e) {
    touches = !e.touches ? null : Array.prototype.slice.call(e.touches).map((touch) => {
      return {
        x: touch.clientX,
        y: touch.clientY,
        id: touch.identifier
      }
    })
    space.move(
      e.offsetX || e.clientX || (e.touches ? e.touches[0].clientX : 0),
      e.offsetY || e.clientY || (e.touches ? e.touches[0].clientY : 0),
      e.shiftKey || (e.touches && e.touches.length === 2),
      touches
    )
  }

  function onMouseUp (e) {
    touches = 0
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
}

module.exports = registerEvents
