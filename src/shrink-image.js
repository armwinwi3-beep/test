// The API accepts receipt images up to 4 MB (Vercel caps request bodies at 4.5 MB).
// Phone photos are often bigger, so large images are redrawn as a smaller JPEG first.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024
const TARGET_BYTES = 3.5 * 1024 * 1024
const MAX_SIDE = 2000

export function scaledSize(width, height, maxSide = MAX_SIDE) {
  const scale = Math.min(1, maxSide / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export async function shrinkImage(file) {
  if (!file || file.size <= TARGET_BYTES) return file
  const bitmap = await createImageBitmap(file)
  let { width, height } = scaledSize(bitmap.width, bitmap.height)
  for (const quality of [0.85, 0.75, 0.65]) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (blob && blob.size <= TARGET_BYTES) {
      return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
    }
    ;({ width, height } = scaledSize(width, height, Math.round(Math.max(width, height) * 0.8)))
  }
  return file
}
