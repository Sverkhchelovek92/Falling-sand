const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    isDrawing = true
    drawAtMouse(e, 1)
  } else if (e.button === 2) {
    isErasing = true
    drawAtMouse(e, 0)
  }
  e.preventDefault()
})

canvas.addEventListener('mousemove', (e) => {
  if (isDrawing) {
    drawAtMouse(e, 1)
  } else if (isErasing) {
    drawAtMouse(e, 0)
  }
})

canvas.addEventListener('mouseup', (e) => {
  if (e.button === 0) isDrawing = false
  if (e.button === 2) isErasing = false
})

canvas.addEventListener('mouseleave', () => {
  isDrawing = false
  isErasing = false
})

canvas.addEventListener('contextmenu', (e) => e.preventDefault())

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
let isErasing = false
let brushSize = 4
let currentMaterial = 1

const brushSlider = document.getElementById('brush-slider')
let brushSliderValue = document.getElementById('brush-value')

brushSlider.addEventListener('input', () => {
  brushSize = parseInt(brushSlider.value)
  brushSliderValue.textContent = brushSize
})

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

function drawAtMouse(e, material) {
  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  // pixels to coordinates
  const cellX = Math.floor(mouseX / CELL_SIZE)
  const cellY = Math.floor(mouseY / CELL_SIZE)

  // let's draw
  for (let dx = -brushSize; dx <= brushSize; dx++) {
    for (let dy = -brushSize; dy <= brushSize; dy++) {
      if (dx * dx + dy * dy <= brushSize * brushSize) {
        const x = cellX + dx
        const y = cellY + dy
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
          grid[x][y] = material
        }
      }
    }
  }
}

function loop() {
  update()
  render()
  requestAnimationFrame(loop)
}

resizeAndInit()
requestAnimationFrame(loop)

// Clear all grid

const clearAllBtn = document.getElementById('clear-all')
clearAllBtn.addEventListener('click', () => {
  grid.forEach((col) => col.fill(0))
  nextGrid.forEach((col) => col.fill(0))
})
