const Signal = require('signals')
const Vec2 = require('pex-math/Vec2')
const Rect = require('pex-geom/Rect')

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
    panning: false,
    oneFingerZooming: false
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
  space.down = (x, y, shift, touches) => {
    console.log('down', x, y)
    const pos = [x, y]
    const posInSpace = space.fromScreenCoords(pos)
    // we will enable one finger zoom on fast double click and drag
    const timeSinceLastClick = Date.now() - space.clickTime
    const distanceFromLastClick = Vec2.distance(pos, space.clickPos)
    console.log('down since', timeSinceLastClick, distanceFromLastClick)

    // hover / hit test
    space.items.forEach((item) => { item.selected = false })
    space.items
      .filter((item) => (item.background || item.image) && Rect.containsPoint(item.rect, posInSpace))
      .forEach((item) => { item.selected = true })
    const selectedItems = space.items.filter((item) => item.selected)

    if (selectedItems.length > 0) {
      selectedItems.forEach((item) => {
        item.prevPosition = Vec2.copy(item.position)
        item.prevScale = item.scale
      })
      space.dragging = true
      if (touches && (touches.length === 2)) {
        console.log('pinch!')
        // Convert touches positions to space coords
        // On the next move convert finger positions to space coords
        // and calculate how much the scale should change to move
        // old position to the new one
        // TODO: is the finger order always the
        // sort just in case, so the order is consistient
        const touchesInSpace = touches.sort((a, b) => a.id - b.id).map((touch) => {
          return { id: touch.id, screenPosition: [touch.x, touch.y], spacePosition: space.fromScreenCoords([touch.x, touch.y]) }
        })
        space.pinchZooming = true
        space.oneFingerZooming = false
        space.panning = false
        space.oldScale = space.scale
        space.touches = touchesInSpace
      }
    } else if (touches && (touches.length === 2)) {
      console.log('pinch!')
      // Convert touches positions to space coords
      // On the next move convert finger positions to space coords
      // and calculate how much the scale should change to move
      // old position to the new one
      // TODO: is the finger order always the
      // sort just in case, so the order is consistient
      const touchesInSpace = touches.sort((a, b) => a.id - b.id).map((touch) => {
        return { id: touch.id, screenPosition: [touch.x, touch.y], spacePosition: space.fromScreenCoords([touch.x, touch.y]) }
      })
      space.pinchZooming = true
      space.oneFingerZooming = false
      space.panning = false
      space.oldScale = space.scale
      space.touches = touchesInSpace
    } else if (timeSinceLastClick < 500 && distanceFromLastClick < space.size[0] / 10) {
      space.oneFingerZooming = true
    } else {
      space.panning = true
    }
    Vec2.set(space.prevOffset, space.offset)
    Vec2.set(space.clickPos, pos)
    Vec2.set(space.prevPos, pos)
    space.clickTime = Date.now()
    space.changed.dispatch(space)
  }

  space.move = (x, y, shift, touches) => {
    const pos = [x, y]
    const posInSpace = space.fromScreenCoords(pos)
    if (space.dragging) {
      const selectedItems = space.items.filter((item) => item.selected)
      if (space.pinchZooming) {
        const touchesInSpace = touches.sort((a, b) => a.id - b.id).map((touch) => {
          return { id: touch.id, screenPosition: [touch.x, touch.y], spacePosition: space.fromScreenCoords([touch.x, touch.y]) }
        })
        const prevPosA = space.touches[0].screenPosition
        const prevPosB = space.touches[1].screenPosition
        const posA = touchesInSpace[0].screenPosition
        const posB = touchesInSpace[1].screenPosition
        const prevCenter = Vec2.scale(Vec2.add(Vec2.copy(prevPosA), prevPosB), 0.5)
        const center = Vec2.scale(Vec2.add(Vec2.copy(posA), posB), 0.5)
        const oldDist = Vec2.distance(prevPosA, prevCenter)
        const dist = Vec2.distance(posA, center)
        const zoom = dist / oldDist
        selectedItems.forEach((item) => {
          item.scale = item.prevScale * zoom
          const dw = item.size[0] * (item.scale - item.prevScale)
          const dh = item.size[1] * (item.scale - item.prevScale)
          Vec2.set(item.position, item.prevPosition)
          Vec2.sub(item.position, [dw / 2, dh / 2])
          item.rect = [item.position, [item.position[0] + item.size[0] * item.scale, item.position[1] + item.size[1] * item.scale]]
        })

        // const zoomPoint = space.fromScreenCoords(prevCenter)
        // space.scale = space.oldScale * zoom
        // const driftedMousePos = space.toScreenCoords(zoomPoint)

        // const delta = Vec2.sub(Vec2.copy(driftedMousePos), prevCenter)
        // Vec2.scale(delta, 1 / space.scale)
        // Vec2.sub(space.offset, delta)

        // space.changed.dispatch(space)
      } else {
        const delta = Vec2.sub(Vec2.copy(pos), space.clickPos)
        Vec2.scale(delta, 1 / space.scale)
        selectedItems.forEach((item) => {
          Vec2.set(item.position, item.prevPosition)
          Vec2.add(item.position, delta)
          item.rect = [item.position, [item.position[0] + item.size[0] * item.scale, item.position[1] + item.size[1] * item.scale]]
        })
      }
      space.changed.dispatch(space)
    } else if (space.panning) {
      const delta = Vec2.sub(Vec2.copy(pos), space.clickPos)
      Vec2.scale(delta, 1 / space.scale)
      Vec2.set(space.offset, space.prevOffset)
      Vec2.add(space.offset, delta)

      space.changed.dispatch(space)
    } else if (space.oneFingerZooming) {
      const delta = Vec2.sub(Vec2.copy(pos), space.prevPos)
      space.scroll(space.clickPos[0], space.clickPos[1], -delta[1])
      space.changed.dispatch(space)
    } else if (space.pinchZooming) {
      const touchesInSpace = touches.sort((a, b) => a.id - b.id).map((touch) => {
        return { id: touch.id, screenPosition: [touch.x, touch.y], spacePosition: space.fromScreenCoords([touch.x, touch.y]) }
      })
      const prevPosA = space.touches[0].screenPosition
      const prevPosB = space.touches[1].screenPosition
      const posA = touchesInSpace[0].screenPosition
      const posB = touchesInSpace[1].screenPosition
      const prevCenter = Vec2.scale(Vec2.add(Vec2.copy(prevPosA), prevPosB), 0.5)
      const center = Vec2.scale(Vec2.add(Vec2.copy(posA), posB), 0.5)
      const oldDist = Vec2.distance(prevPosA, prevCenter)
      const dist = Vec2.distance(posA, center)
      const zoom = dist / oldDist

      const zoomPoint = space.fromScreenCoords(prevCenter)
      space.scale = space.oldScale * zoom
      const driftedMousePos = space.toScreenCoords(zoomPoint)

      const delta = Vec2.sub(Vec2.copy(driftedMousePos), prevCenter)
      Vec2.scale(delta, 1 / space.scale)
      Vec2.sub(space.offset, delta)

      space.changed.dispatch(space)
    } else {
      space.items.forEach((item) => { item.hover = false })
      space.items
        .filter((item) => (item.background || item.image) && Rect.containsPoint(item.rect, posInSpace))
        .forEach((item) => { item.hover = true })
      space.changed.dispatch(space)
    }
    // prevent one finger zoom to kick in when panning
    space.clickTime = 0

    Vec2.set(space.prevPos, pos)
  }

  space.up = () => {
    console.log('up')
    space.panning = false
    space.oneFingerZooming = false
    space.pinchZooming = false
    space.touches = null
    space.dragging = false

    space.items.forEach((item) => { item.hover = false })
    space.changed.dispatch(space)
  }

  // We want scroll to zoom toward the point under the mouse
  space.scroll = (x, y, dy, zoom) => {
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
    if (dy >= 0) space.scale *= 1.0 + dy / zoomScale
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
    // move mouse pos to the space coords
    Vec2.scale(spacePos, 1 / space.scale)
    // cancel out the offset
    Vec2.sub(spacePos, space.offset)
    return spacePos
  }

  space.toScreenCoords = (pos) => {
    const screenPos = Vec2.copy(pos)
    // add the offset
    Vec2.add(screenPos, space.offset)
    // move from space coords to the screen coords
    Vec2.scale(screenPos, space.scale)
    return screenPos
  }

  setTimeout(() => {
    space.changed.dispatch(this)
  }, 1)

  return space
}

module.exports = createSpace
