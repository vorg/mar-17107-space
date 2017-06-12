function init (space) {
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
}

module.exports = {
  init: init
}
