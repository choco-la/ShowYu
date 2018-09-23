import { IChrome, IChromeItem } from './types/deftype'
import { isHTMLElem } from './types/typeguards'

const isTimelime = (text: string): string | null => {
  const checker = {
    federated: /連合タイムライン|Federated timeline/,
    home: /ホーム|Home timeline/,
    local: /ローカルタイムライン|Local timeline/
  }
  for (const [timeline, regex] of Object.entries(checker)) {
    if (regex.test(text)) return timeline
  }
  return null
}

const getTimelines = () => {
  // const columns = document.querySelectorAll('.column')
  const columns = document.getElementsByClassName('column')
  const timelines: { [key: string]: Element | null } = {
    federated: null,
    home: null,
    local: null
  }
  for (const column of columns) {
    const button = column.querySelector('button')
    if (!isHTMLElem(button)) continue
    const timeline = isTimelime(button.innerText)

    if (timeline) timelines[timeline] = column
  }

  return timelines
}

const muteFilter = (nodelist: NodeList, regex: RegExp) => {
  for (const node of nodelist) {
    if (!isHTMLElem(node)) continue

    const textNode = node.querySelector('.status__content.status__content--with-action')
    if (!isHTMLElem(textNode)) continue

    if (!regex.test(textNode.innerText)) continue

    console.debug(`muted: ${textNode.innerText}`)
    node.style.display = 'none'
  }
}

const muteWithRegex = (regex: RegExp, timeline: Element) => {
  const onMutation: MutationCallback = (mutation) => mutation.map((dom) => {
    muteFilter(dom.addedNodes, regex)
  })
  const observer = new MutationObserver(onMutation)
  const configure = {
    childList: true
  }
  observer.observe(timeline.getElementsByClassName('item-list')[0], configure)
}

const regexPatterns: {[key: string]: string[]} = {
  federated: [],
  home: [],
  local: []
}

const getStorage = (): Promise<IChromeItem> => {
  return new Promise((resolve, _) => {
    chrome.storage.local.get(location.hostname, (item: IChromeItem) => {
      resolve(item)
    })
  })
}

declare var chrome: IChrome
export const applyRegexFilter = async () => {
  try {
    const storage = await getStorage()
    const instanceRegex = storage[location.hostname]
    Object.entries(instanceRegex).map(([timeline, pattern]) => {
      if (timeline === 'all') {
        Object.keys(regexPatterns).map((tl) => regexPatterns[tl].push(pattern))
      } else {
        regexPatterns[timeline].push(pattern)
      }
    })
  } catch (err) {
    console.error(err)
    const pattern = prompt('Enter Regular Expression')
    if (pattern) {
      Object.keys(regexPatterns).map((tl) => regexPatterns[tl].push(pattern))
    }
  }

  // Apply
  for (const [title, dom] of Object.entries(getTimelines())) {
    if (!dom) {
      console.debug('no dom found')
      continue
    }
    if (!regexPatterns[title].length) {
      console.debug('no regex found')
      continue
    }
    const pattern = regexPatterns[title].join('|')
    if (!pattern || !pattern.trim()) continue
    muteWithRegex(new RegExp(pattern.trim()), dom)
  }
}
