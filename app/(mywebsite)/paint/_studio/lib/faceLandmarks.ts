import type { FaceShape, NormalisedPoint } from '../engine/knife'

const WASM_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
const MAX_FACES = 4

const OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
const FEATURES: Record<string, number[]> = {
  leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  rightEye: [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466],
  leftBrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  rightBrow: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
  lips: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185],
}

interface Landmark {
  x: number
  y: number
}

type Landmarker = { detect(image: ImageData): { faceLandmarks: Landmark[][] } }

let landmarker: Promise<Landmarker> | null = null

async function createLandmarker(): Promise<Landmarker> {
  const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
  const files = await FilesetResolver.forVisionTasks(WASM_ROOT)
  return FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL_URL }, numFaces: MAX_FACES, runningMode: 'IMAGE' })
}

function polygon(landmarks: Landmark[], indices: number[]): NormalisedPoint[] {
  return indices.map((i) => [landmarks[i].x, landmarks[i].y])
}

function toShape(landmarks: Landmark[]): FaceShape {
  const features: Record<string, NormalisedPoint[]> = {}
  for (const [name, indices] of Object.entries(FEATURES)) features[name] = polygon(landmarks, indices)
  return { oval: polygon(landmarks, OVAL), features }
}

export async function findFaces(image: ImageData): Promise<FaceShape[]> {
  landmarker ??= createLandmarker()
  const result = (await landmarker).detect(image)
  return result.faceLandmarks.map(toShape)
}
