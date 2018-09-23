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
    const input = document.querySelector(`input[name="${name}"]`)
    let savedData
    // eslint-disable-next-line no-undef
    chrome.storage.local.get(instance, (item) => {
      if (Object.keys(item).length) {
        savedData = item[instance]
        input.value = savedData.regexPattern
      } else {
        savedData = {'regexPattern': ''}
      }
    })

    input.addEventListener('input', () => {
      savedData.regexPattern = input.value
      const newData = {}
      newData[instance] = savedData
    // eslint-disable-next-line no-undef
      chrome.storage.local.set(newData)
    })
  }
})()
