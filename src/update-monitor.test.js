import test from 'node:test'
import assert from 'node:assert/strict'
import { createUpdateMonitor } from './update-monitor.js'

function setup() {
  const state = { safe: true, response: { version: 'new' }, attempt: null, reloads: 0, timers: new Map(), states: [], next: 0 }
  const monitor = createUpdateMonitor({
    currentVersion: 'old', versionUrl: '/version.json', canReload: () => state.safe,
    fetchVersion: async () => { if (state.error) throw Error('offline'); return state.response },
    readAttempt: () => state.attempt, writeAttempt: value => { state.attempt = value },
    reload: () => state.reloads++, onState: value => state.states.push(value),
    setTimer: (fn, delay) => { assert.equal(delay, 3000); const id = ++state.next; state.timers.set(id, fn); return id },
    clearTimer: id => state.timers.delete(id),
  })
  const tick = () => { const callbacks = [...state.timers.values()]; state.timers.clear(); callbacks.forEach(fn => fn()) }
  return { state, monitor, tick }
}
test('new version displays notice before reloading and records attempt', async () => {
  const { state, monitor, tick } = setup(); await monitor.check()
  assert.equal(state.reloads, 0); assert.deepEqual(state.states, ['updating'])
  tick(); assert.equal(state.reloads, 1); assert.equal(state.attempt, 'new')
})
test('drafts or requests defer reload until safe', async () => {
  const { state, monitor, tick } = setup(); state.safe = false; await monitor.check()
  tick(); assert.equal(state.reloads, 0); assert.deepEqual(state.states, ['waiting'])
  state.safe = true; monitor.reconsider(); tick(); assert.equal(state.reloads, 1)
})
test('editing during countdown cancels and starts a fresh countdown afterward', async () => {
  const { state, monitor, tick } = setup(); await monitor.check()
  state.safe = false; monitor.reconsider(); tick(); assert.equal(state.reloads, 0)
  state.safe = true; monitor.reconsider(); assert.equal(state.reloads, 0); tick(); assert.equal(state.reloads, 1)
})
test('rechecks safety at reload time even without an event', async () => {
  const { state, monitor, tick } = setup(); await monitor.check(); state.safe = false
  tick(); assert.equal(state.reloads, 0)
})
test('same version and malformed manifests do not reload', async () => {
  for (const response of [{version:'old'}, {}, {version:null}, {version:''}]) {
    const {state, monitor, tick} = setup(); state.response = response; await monitor.check(); tick(); assert.equal(state.reloads,0)
  }
})
test('network errors are retried after recovery', async () => {
  const {state, monitor, tick} = setup(); state.error = true; await monitor.check(); tick(); assert.equal(state.reloads,0)
  state.error = false; await monitor.check(); tick(); assert.equal(state.reloads,1)
})
test('stale HTML does not cause repeat reload for the same target', async () => {
  const {state, monitor, tick} = setup(); state.attempt = 'new'; await monitor.check(); tick(); assert.equal(state.reloads,0)
  state.response = {version:'next'}; await monitor.check(); tick(); assert.equal(state.reloads,1)
})
test('dispose cancels scheduled reload', async () => {
  const {state, monitor, tick} = setup(); await monitor.check(); monitor.dispose(); tick(); assert.equal(state.reloads,0)
})
