import { IChrome, IChromeItem } from './types/deftype'
import { isHTMLElem } from './types/typeguards'

const isTimelineEN = (text: string): boolean => /Home|(?:Local|Federated)[\s]timeline/.test(text)
const isTimelineJP = (text: string): boolean => /ホーム|(?:ローカル|連合)タイムライン/.test(text)

const COLUMNS = document.querySelectorAll('.column')
console.debug(COLUMNS)
const TIMELINES: Element[] = (() => {
  const timelines: Element[] = []
  for (const column of COLUMNS) {
    const button = column.querySelector('button')
    if (!isHTMLElem(button)) continue
    if (!isTimelineJP(button.innerText) && !isTimelineEN(button.innerText)) continue

    timelines.push(column)
  }
  return timelines
})()

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

const muteWithRegex = (regex: RegExp) => {
  const onMutation: MutationCallback = (mutation) => mutation.map((dom) => muteFilter(dom.addedNodes, regex))
  const observer = new MutationObserver(onMutation)
  const configure = {
    childList: true
  }
  TIMELINES.map((timeline) => observer.observe(timeline.getElementsByClassName('item-list')[0], configure))
}

declare var chrome: IChrome
export const applyRegexFilter = () => {
  try {
    chrome.storage.local.get(location.hostname, (item: IChromeItem) => {
      if (item[location.hostname].regexPattern) {
        const regexPattern = item[location.hostname].regexPattern
        muteWithRegex(new RegExp(regexPattern))
      }
    })
  } catch {
    const pattern = prompt('Enter Regular Expression')
    if (pattern) {
      muteWithRegex(new RegExp(pattern))
    }
  }
}
