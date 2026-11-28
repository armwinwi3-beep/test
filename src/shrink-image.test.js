import test from 'node:test'
import assert from 'node:assert/strict'
import { scaledSize, shrinkImage } from './shrink-image.js'

test('large photos are scaled so the long side is at most 2000px', () => {
  assert.deepEqual(scaledSize(4032, 3024), { width: 2000, height: 1500 })
  assert.deepEqual(scaledSize(3024, 4032), { width: 1500, height: 2000 })
})

test('small photos keep their size', () => {
  assert.deepEqual(scaledSize(1200, 900), { width: 1200, height: 900 })
})

test('files already under the limit are returned unchanged', async () => {
  const file = { size: 1024, name: 'a.png' }
  assert.equal(await shrinkImage(file), file)
})
