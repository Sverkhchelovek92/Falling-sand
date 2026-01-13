const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true
  drawAtMouse(e)
})

canvas.addEventListener('mousemove', (e) => {
  if (isDrawing) {
    drawAtMouse(e)
  }
})

canvas.addEventListener('mouseup', () => {
  isDrawing = false
})
canvas.addEventListener('mouseleave', () => {
  isDrawing = false
})

const CELL_SIZE = 4

let cols, rows

let grid
let nextGrid

let imageData
let buffer

const COLORS = {
  0: 0xff222222,
  1: 0xff00b7eb,
}

let isDrawing = false
let brushSize = 8
let currentMaterial = 1

function resizeAndInit() {
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight

  initGrid()
  createImageData()

  // Test sand
  const startX = Math.floor(cols / 2 - 10)
  const endX = Math.floor(cols / 2 + 10)
  for (let x = startX; x < endX; x++) {
    for (let y = 10; y < 20; y++) {
      if (x >= 0 && x < cols && y >= 0 && y < rows) {
        grid[x][y] = 1
      }
    }
  }

  render()
}

// resizeAndInit()
window.addEventListener('resize', () => {
  resizeAndInit()
})

function createImageData() {
  imageData = ctx.createImageData(cols * CELL_SIZE, rows * CELL_SIZE)
  buffer = new Uint32Array(imageData.data.buffer)
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

function render() {
  buffer.fill(COLORS[0])

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const cell = grid[x][y]
      if (cell === 0) continue

      const color = COLORS[cell]

      const startX = x * CELL_SIZE
      const startY = y * CELL_SIZE

      for (let dx = 0; dx < CELL_SIZE; dx++) {
        for (let dy = 0; dy < CELL_SIZE; dy++) {
          const px = startX + dx
          const py = startY + dy
          const index = py * (cols * CELL_SIZE) + px
          buffer[index] = color
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0)
}

function update() {
  // let's copy grid to nextGrid
  for (let x = 0; x < cols; x++) {
    nextGrid[x].fill(0)
    for (let y = 0; y < rows; y++) {
      nextGrid[x][y] = grid[x][y]
    }
  }

  // Update from bottom to top
  for (let x = 0; x < cols; x++) {
    for (let y = rows - 2; y >= 0; y--) {
      if (grid[x][y] === 1) {
        let moved = false

        if (y + 1 < rows && nextGrid[x][y + 1] === 0) {
          nextGrid[x][y + 1] = 1
          nextGrid[x][y] = 0
          moved = true
        } else {
          const leftFirst = Math.random() < 0.5
          const directions = leftFirst ? [-1, 1] : [1, -1]

          for (const dir of directions) {
            const nx = x + dir
            if (
              !moved &&
              y + 1 < rows &&
              nx >= 0 &&
              nx < cols &&
              nextGrid[nx][y + 1] === 0
            ) {
              nextGrid[nx][y + 1] = 1
              nextGrid[x][y] = 0
              moved = true
              break
            }
          }
        }
      }
    }
  }
  ;[grid, nextGrid] = [nextGrid, grid]
}

function loop() {
  update()
  render()
  requestAnimationFrame(loop)
}

resizeAndInit()
requestAnimationFrame(loop)
