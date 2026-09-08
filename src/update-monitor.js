// Poll only while visible; defer navigation until the app is safe to reload.
export function createUpdateMonitor({ currentVersion, versionUrl, canReload, onState, reload,
  fetchVersion, readAttempt, writeAttempt, setTimer = setTimeout, clearTimer = clearTimeout }) {
  let target = null
  let checking = false
  let disposed = false
  let timer = null
  const cancel = () => { if (timer !== null) clearTimer(timer); timer = null }
  const reconsider = () => {
    if (disposed || !target) return
    if (!canReload()) { cancel(); onState('waiting'); return }
    if (timer !== null) return
    onState('updating')
    timer = setTimer(() => {
      timer = null
      if (disposed) return
      if (!canReload()) { onState('waiting'); return }
      // Stop repeated reloads if an intermediary serves stale HTML.
      try { writeAttempt(target) } catch { /* Storage can be unavailable in webviews. */ }
      reload()
    }, 3000)
  }
  const check = async () => {
    if (disposed || checking) return
    if (target) { reconsider(); return }
    checking = true
    try {
      const data = await fetchVersion(versionUrl)
      if (disposed || typeof data?.version !== 'string' || !data.version.trim() || data.version === currentVersion) return
      let attempt
      try { attempt = readAttempt() } catch { /* Storage is optional. */ }
      if (attempt === data.version) return
      target = data.version
      reconsider()
    } catch { /* Offline, failed deployments and invalid responses are retried later. */ }
    finally { checking = false }
  }
  return { check, reconsider, dispose() { disposed = true; cancel() } }
}
