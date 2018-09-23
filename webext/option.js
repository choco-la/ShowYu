(() => {
  'use strict'
  const instanceList = [
    'mstdn.jp',
    'pawoo.net',
    'music.pawoo.net',
    'friends.nico'
  ]
  for (const instance of instanceList) {
    // Replace '.' for name attribute.
    const name = instance.replace(/\./g, '_')
    const inputs = document.querySelectorAll(`input[name="${name}"]`)
    for (const input of inputs) {
      const timeline = input.getAttribute('timeline')
      if (!name || !input || !timeline) return

      let savedData
      // eslint-disable-next-line no-undef
      chrome.storage.local.get(instance, (item) => {
        if (Object.keys(item).length) {
          savedData = item[instance]
          input.value = savedData[timeline]
        } else {
          savedData = {
            all: '',
            federated: '',
            home: '',
            local: ''
          }
        }
      })

      input.addEventListener('input', () => {
        savedData[timeline] = input.value
        const newData = {}
        newData[instance] = savedData
      // eslint-disable-next-line no-undef
        chrome.storage.local.set(newData)
      })
    }
  }
})()
