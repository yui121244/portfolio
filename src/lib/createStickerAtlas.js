import { CanvasTexture, LinearFilter, SRGBColorSpace, Vector4 } from 'three'

const stickerModules = import.meta.glob('../../assets/stickers/*.{webp,png,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const STICKER_URLS = Object.entries(stickerModules)
  .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
  .map(([, url]) => url)

export const STICKER_ASSET_COUNT = STICKER_URLS.length

const TILE = 256
const GUTTER = 4
const CELL = TILE + GUTTER * 2
const COLUMNS = Math.ceil(Math.sqrt(STICKER_ASSET_COUNT))
const ROWS = Math.ceil(STICKER_ASSET_COUNT / COLUMNS)

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Unable to load sticker asset: ${url}`))
    image.src = url
  })
}

function drawContained(context, image, index) {
  const column = index % COLUMNS
  const row = Math.floor(index / COLUMNS)
  const scale = Math.min(TILE / image.naturalWidth, TILE / image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  const x = column * CELL + GUTTER + (TILE - width) * 0.5
  const y = row * CELL + GUTTER + (TILE - height) * 0.5
  context.drawImage(image, x, y, width, height)
}

function createUvRect(index, canvasWidth, canvasHeight) {
  const column = index % COLUMNS
  const row = Math.floor(index / COLUMNS)
  const x = column * CELL + GUTTER
  const y = row * CELL + GUTTER

  return new Vector4(
    (x + 0.5) / canvasWidth,
    1 - (y + TILE - 0.5) / canvasHeight,
    (TILE - 1) / canvasWidth,
    (TILE - 1) / canvasHeight,
  )
}

export function createStickerAtlas() {
  const canvas = document.createElement('canvas')
  canvas.width = CELL * COLUMNS
  canvas.height = CELL * ROWS
  const context = canvas.getContext('2d')
  context.clearRect(0, 0, canvas.width, canvas.height)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = false

  Promise.all(STICKER_URLS.map(loadImage))
    .then((images) => {
      images.forEach((image, index) => drawContained(context, image, index))
      texture.needsUpdate = true
    })
    .catch((error) => {
      console.error(error)
    })

  const uvRects = STICKER_URLS.map((_, index) => (
    createUvRect(index, canvas.width, canvas.height)
  ))

  return { texture, uvRects, count: STICKER_ASSET_COUNT }
}
