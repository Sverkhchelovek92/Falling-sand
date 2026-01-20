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

let selectedSandColor = 0xffeedaa6
let selectedBackgroundColor = 0xff222222
let colorGrid
let nextColorGrid

let shiftPressed = false

const brushSlider = document.getElementById('brush-slider')
let brushSliderValue = document.getElementById('brush-value')

function toCanvasColor(argb) {
  const a = (argb >> 24) & 0xff
  const r = (argb >> 16) & 0xff
  const g = (argb >> 8) & 0xff
  const b = argb & 0xff
  return (a << 24) | (b << 16) | (g << 8) | r
}

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
        colorGrid[x][y] = selectedSandColor
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
  colorGrid = create2Darray(cols, rows)
  nextColorGrid = create2Darray(cols, rows)

  for (let x = 0; x < cols; x++) {
    colorGrid[x].fill(0)
    nextColorGrid[x].fill(0)
  }
}

function create2Darray(w, h) {
  const arr = new Array(w)
  for (let x = 0; x < w; x++) {
    arr[x] = new Array(h).fill(0)
  }
  return arr
}

function render() {
  buffer.fill(toCanvasColor(selectedBackgroundColor))

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const cell = grid[x][y]
      if (cell === 0) continue

      let colorRaw

      if (cell === 1) {
        colorRaw = colorGrid[x][y] !== 0 ? colorGrid[x][y] : selectedSandColor
      } else {
        colorRaw = COLORS[cell] || COLORS[0]
      }

      const color = toCanvasColor(colorRaw)

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
  for (let x = 0; x < cols; x++) {
    nextGrid[x].fill(0)
    nextColorGrid[x].fill(0)
  }

  // let's copy grid to nextGrid
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      nextGrid[x][y] = grid[x][y]
      nextColorGrid[x][y] = colorGrid[x][y]
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

          nextColorGrid[x][y + 1] = colorGrid[x][y]
          nextColorGrid[x][y] = 0

          moved = true
        } else if (grid[x][y] === 2) {
          let moved = false

          if (y + 1 < rows && nextGrid[x][y + 1] === 0) {
            nextGrid[x][y + 1] = 2
            nextGrid[x][y] = 0
            moved = true
          } else if (
            y + 2 < rows &&
            nextGrid[x][y + 1] !== 0 &&
            nextGrid[x][y + 2] === 0
          ) {
            nextGrid[x][y + 2] = 2
            nextGrid[x][y] = 0
            moved = true
          }

          if (!moved) {
            const dirs = [-1, 1]
            const dir = dirs[Math.floor(Math.random() * 2)]

            if (
              y + 1 < rows &&
              x + dir >= 0 &&
              x + dir < cols &&
              nextGrid[x + dir][y + 1] === 0
            ) {
              nextGrid[x + dir][y + 1] = 2
              nextGrid[x][y] = 0
              moved = true
            }

            if (
              !moved &&
              x + dir >= 0 &&
              x + dir < cols &&
              nextGrid[x + dir][y] === 0
            ) {
              nextGrid[x + dir][y] = 3
              nextGrid[x][y] = 0
              moved = true
            }
          }
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

              nextColorGrid[nx][y + 1] = colorGrid[x][y]
              nextColorGrid[x][y] = 0

              moved = true
              break
            }
          }
        }
      }
    }
  }

  ;[grid, nextGrid] = [nextGrid, grid]
  ;[colorGrid, nextColorGrid] = [nextColorGrid, colorGrid]
}

function drawAtMouse(e, material) {
  const rect = canvas.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  // pixels to coordinates
  const cellX = Math.floor(mouseX / CELL_SIZE)
  const cellY = Math.floor(mouseY / CELL_SIZE)

  const cells = []

  for (let dx = -brushSize; dx <= brushSize; dx++) {
    for (let dy = -brushSize; dy <= brushSize; dy++) {
      if (dx * dx + dy * dy <= brushSize * brushSize) {
        const x = cellX + dx
        const y = cellY + dy
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
          cells.push({ x, y })
        }
      }
    }
  }

  if (shiftPressed && material === 1) {
    const sandColors = []
    for (const cell of cells) {
      if (grid[cell.x][cell.y] === 1) {
        sandColors.push(colorGrid[cell.x][cell.y])
      }
    }

    for (let i = sandColors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[sandColors[i], sandColors[j]] = [sandColors[j], sandColors[i]]
    }

    let colorIndex = 0
    for (const cell of cells) {
      if (grid[cell.x][cell.y] === 1) {
        colorGrid[cell.x][cell.y] = sandColors[colorIndex]
        colorIndex++
      }
    }
  } else {
    for (let dx = -brushSize; dx <= brushSize; dx++) {
      for (let dy = -brushSize; dy <= brushSize; dy++) {
        if (dx * dx + dy * dy <= brushSize * brushSize) {
          const x = cellX + dx
          const y = cellY + dy
          if (x >= 0 && x < cols && y >= 0 && y < rows) {
            if (material === 1) {
              if (grid[x][y] === 0) {
                grid[x][y] = 1
                colorGrid[x][y] = selectedSandColor
              }
            } else {
              grid[x][y] = material
              colorGrid[x][y] = 0
            }
          }
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

// Color select

document.querySelectorAll('.sandColor').forEach((el) => {
  el.addEventListener('click', () => {
    document
      .querySelectorAll('.sandColor')
      .forEach((c) => c.classList.remove('active'))

    el.classList.add('active')

    selectedSandColor = Number(el.dataset.color)

    console.log('Chosen color:', selectedSandColor.toString(16))
  })
})

// Shift listeners
window.addEventListener('keydown', (e) => {
  if (e.key === 'Shift') shiftPressed = true
})

window.addEventListener('keyup', (e) => {
  if (e.key === 'Shift') shiftPressed = false
})

// Background select
document.querySelectorAll('.bg-color').forEach((el) => {
  el.addEventListener('click', () => {
    document
      .querySelectorAll('.bg-color')
      .forEach((c) => c.classList.remove('active'))
    el.classList.add('active')

    selectedBackgroundColor = Number(el.dataset.color)
    console.log(
      'Background color changed to:',
      selectedBackgroundColor.toString(16),
    )
  })
})
