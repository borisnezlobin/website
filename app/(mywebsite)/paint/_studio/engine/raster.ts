export interface RgbImage {
  width: number
  height: number
  data: Float32Array
}

export interface Field {
  width: number
  height: number
  data: Float32Array
}

export function createImage(width: number, height: number): RgbImage {
  return { width, height, data: new Float32Array(width * height * 3) }
}

export function createField(width: number, height: number, fill = 0): Field {
  const data = new Float32Array(width * height)
  if (fill !== 0) data.fill(fill)
  return { width, height, data }
}

export function fillImage(image: RgbImage, rgb: readonly [number, number, number]): void {
  const { data } = image
  for (let i = 0; i < data.length; i += 3) {
    data[i] = rgb[0]
    data[i + 1] = rgb[1]
    data[i + 2] = rgb[2]
  }
}

export function imageFromRgba(rgba: Uint8ClampedArray | Uint8Array, width: number, height: number): RgbImage {
  const image = createImage(width, height)
  const pixelCount = width * height
  for (let p = 0; p < pixelCount; p++) {
    image.data[p * 3] = rgba[p * 4] / 255
    image.data[p * 3 + 1] = rgba[p * 4 + 1] / 255
    image.data[p * 3 + 2] = rgba[p * 4 + 2] / 255
  }
  return image
}

export function imageToRgba(image: RgbImage): Uint8ClampedArray {
  const pixelCount = image.width * image.height
  const rgba = new Uint8ClampedArray(pixelCount * 4)
  for (let p = 0; p < pixelCount; p++) {
    rgba[p * 4] = Math.round(image.data[p * 3] * 255)
    rgba[p * 4 + 1] = Math.round(image.data[p * 3 + 1] * 255)
    rgba[p * 4 + 2] = Math.round(image.data[p * 3 + 2] * 255)
    rgba[p * 4 + 3] = 255
  }
  return rgba
}

export function sampleFieldBilinear(field: Field, x: number, y: number): number {
  const { width, height, data } = field
  const cx = Math.min(Math.max(x, 0), width - 1)
  const cy = Math.min(Math.max(y, 0), height - 1)
  const x0 = Math.floor(cx)
  const y0 = Math.floor(cy)
  const x1 = Math.min(x0 + 1, width - 1)
  const y1 = Math.min(y0 + 1, height - 1)
  const fx = cx - x0
  const fy = cy - y0
  const top = data[y0 * width + x0] * (1 - fx) + data[y0 * width + x1] * fx
  const bottom = data[y1 * width + x0] * (1 - fx) + data[y1 * width + x1] * fx
  return top * (1 - fy) + bottom * fy
}

export function sampleImageBilinear(image: RgbImage, x: number, y: number, out: Float32Array | number[]): void {
  const { width, height, data } = image
  const cx = Math.min(Math.max(x, 0), width - 1)
  const cy = Math.min(Math.max(y, 0), height - 1)
  const x0 = Math.floor(cx)
  const y0 = Math.floor(cy)
  const x1 = Math.min(x0 + 1, width - 1)
  const y1 = Math.min(y0 + 1, height - 1)
  const fx = cx - x0
  const fy = cy - y0
  const w00 = (1 - fx) * (1 - fy)
  const w10 = fx * (1 - fy)
  const w01 = (1 - fx) * fy
  const w11 = fx * fy
  const i00 = (y0 * width + x0) * 3
  const i10 = (y0 * width + x1) * 3
  const i01 = (y1 * width + x0) * 3
  const i11 = (y1 * width + x1) * 3
  for (let c = 0; c < 3; c++) {
    out[c] = data[i00 + c] * w00 + data[i10 + c] * w10 + data[i01 + c] * w01 + data[i11 + c] * w11
  }
}

export function splitChannels(image: RgbImage): [Field, Field, Field] {
  const pixelCount = image.width * image.height
  const channels: [Field, Field, Field] = [
    createField(image.width, image.height),
    createField(image.width, image.height),
    createField(image.width, image.height),
  ]
  for (let p = 0; p < pixelCount; p++) {
    channels[0].data[p] = image.data[p * 3]
    channels[1].data[p] = image.data[p * 3 + 1]
    channels[2].data[p] = image.data[p * 3 + 2]
  }
  return channels
}

export function mergeChannels(channels: readonly [Field, Field, Field]): RgbImage {
  const { width, height } = channels[0]
  const image = createImage(width, height)
  for (let p = 0; p < width * height; p++) {
    image.data[p * 3] = channels[0].data[p]
    image.data[p * 3 + 1] = channels[1].data[p]
    image.data[p * 3 + 2] = channels[2].data[p]
  }
  return image
}

export function luminance(image: RgbImage): Field {
  const field = createField(image.width, image.height)
  const { data } = image
  for (let p = 0; p < field.data.length; p++) {
    field.data[p] = 0.2126 * data[p * 3] + 0.7152 * data[p * 3 + 1] + 0.0722 * data[p * 3 + 2]
  }
  return field
}

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

