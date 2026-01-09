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
