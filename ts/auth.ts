export const ACCESS_TOKEN = (() => {
  const initStateNode = document.getElementById('initial-state')
  if (!initStateNode || !initStateNode.textContent) throw new Error('cannot get initial-state')
  const initState = JSON.parse(initStateNode.textContent)

  const meta = initState.meta
  return meta.access_token
})()
