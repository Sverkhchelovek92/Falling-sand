const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

function resizeCanvas() {
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight
}

resizeCanvas()
window.addEventListener('resize', resizeCanvas)

const CELL_SIZE = 4
let cols, rows

let grid
let nextGrid

let imageData
let buffer

function createImageData() {
  imageData = ctx.createImageData(cols * CELL_SIZE, rows * CELL_SIZE)
  buffer = new Uint32Array(imageData.data.buffer)
}

const COLORS = {
  0: 0xff222222,
  1: 0xff00b7eb,
}

function initGrid() {
  cols = Math.floor(canvas.width / CELL_SIZE)
  rows = Math.floor(canvas.height / CELL_SIZE)

  grid = create2Darray(cols, rows)
  nextGrid = create2Darray(cols, rows)
}

function create2Darray(w, h) {
  const arr = new Array(w)
  for (let x = 0; x < w; x++) {
    arr[x] = new Array(h).fill(0)
  }
  return arr
}
