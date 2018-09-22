import { basename } from 'path'
import { ACCESS_TOKEN } from './auth'
import { getAncestor } from './dom'
import { getAccountPage, getAccounts } from './request'
import { IAccount, Window } from './types/deftype'
import { isHTMLElem } from './types/typeguards'

// For window.origin
// tslint:disable-next-line:interface-name
declare var window: Window

const replaceTootCount = (count: string) => {
  const accountTab = document.querySelector('.account__action-bar__tab')
  if (!isHTMLElem(accountTab)) return console.debug('accountTab is not HTMLElement')

  accountTab.getElementsByTagName('strong')[0].innerText = count
}

const execReplace = async (dataID: string, token: string) => {
  const responce = await getAccounts(dataID, token)
  const accounts = await responce.json() as IAccount

  const tootCount = accounts.statuses_count.toString()
  replaceTootCount(tootCount)
}

const parser = new window.DOMParser()
const nameToID = async (name: string) => {
  const responce = await getAccountPage(name)
  const text = await responce.text()

  const dom = parser.parseFromString(text, 'text/html')
  const links = dom.getElementsByTagName('link')
  for (const link of links) {
    if (link.getAttribute('rel') !== 'salmon') continue
    const href = link.getAttribute('href')
    if (!href) continue
    return basename(href)
  }
  throw new Error('no account name found')
}

const caseNotificationDisplayName = (target: HTMLElement) => {
  const to = target.getAttribute('to')
  return to ? basename(to) : null
}

const caseAvatarIcon = (target: HTMLElement) => {
  const parent = getAncestor(target)
  // my own icon on the left column
  if (parent.hasAttribute('to')) return basename(parent.getAttribute('to') as string)

  const grandParent = getAncestor(parent)
  // search result
  const to = grandParent.getAttribute('to')
  // avatar on timelines
  const dataID = grandParent.getAttribute('data-id')
  return to ? basename(to) : dataID
}

const caseAvatarIconBT = (target: HTMLElement) => {
  const grandParent = getAncestor(target, 3)
  const dataID = grandParent.getAttribute('data-id')
  return dataID
}

const caseDisplayName = (target: HTMLElement) => {
  const parent = getAncestor(target)
  const to = parent.getAttribute('to')

  const dataID = target.getAttribute('data-id')
  return to ? basename(to) : dataID
}

const caseDisplayNameAccount = (target: HTMLElement) => {
  const grandParent = getAncestor(target, 2)
  const dataID = grandParent.getAttribute('data-id')
  return dataID
}

const caseDisplayNameHTML = (target: HTMLElement) => {
  const greatGrandParent = getAncestor(target, 3)
  const dataID = greatGrandParent.getAttribute('data-id')
  const to = greatGrandParent.getAttribute('to')
  if (dataID) return dataID
  else if (to) return basename(to)
  return getAncestor(greatGrandParent).getAttribute('data-id')
}

const caseEmojiOne = (target: HTMLElement) => {
  // in case friends.nico user emoji
  const alt = target.getAttribute('alt')
  if (alt && /^:@[a-z0-9_]+:$/i.test(alt)) {
    return nameToID(alt.slice(1, -1))
  }

  const parent = getAncestor(target)
  const caseNotification = caseNotificationDisplayName(parent)
  if (caseNotification) return caseNotification

  // emoji on boost user
  const greatGrandParent = getAncestor(parent, 2)
  const emojiBT = caseDisplayName(greatGrandParent)

  return emojiBT ? emojiBT : caseDisplayNameHTML(parent)
}

const caseNavigationProfileAccount = (target: HTMLElement) => {
  const parent = getAncestor(target)
  const to = parent.getAttribute('to')
  return to ? basename(to) : null
}

const caseNoClassNameStrong = (target: HTMLElement) => {
  const grandParent = getAncestor(target, 2)
  return grandParent.getAttribute('data-id')
}

const regexUserPage = new RegExp(`^${window.origin.replace('.', '\\.')}/web/accounts/[1-9][0-9]*$`)
const onHistoryBack = () => {
  console.debug('statechange')
  if (!regexUserPage.test(location.href)) return console.debug('not user page')

  const dataID = basename(location.href)
  execReplace(dataID, ACCESS_TOKEN)
}

const delayExecute = (func: () => void, time: number): Promise<void> => {
  return new Promise((resolve, _) => {
    setTimeout(() => resolve(func()), time * 1000)
  })
}

export const onClicked = async (event: MouseEvent) => {
  // EventTarget not always HTMLElement
  const target = event.target as HTMLElement
  console.debug(target.className)

  // history back
  if (target.className === 'column-back-button') {
    console.debug('onHistoryBack')
    // await new Promise((resolve, _) => setTimeout(() => resolve, 500))
    // await onHistoryBack()
    delayExecute(onHistoryBack, 0.5)
    return
  }

  const dataID = await (() => {
    switch (target.className) {
      // username in notifications
      case 'permalink notification__display-name': {
        return caseNotificationDisplayName(target)
      }
      // emoji on username in notifications
      case 'emojione': {
        return caseEmojiOne(target)
      }
      // avatar icon div
      case 'account__avatar':
      case 'account__avatar-overlay': {
        return caseAvatarIcon(target)
      }
      // boosted avatar icon div
      case 'account__avatar-overlay-base':
      case 'account__avatar-overlay-overlay': {
        return caseAvatarIconBT(target)
      }
      // screenname span
      case 'display-name__account': {
        return caseDisplayNameAccount(target)
      }
      // username strong
      case 'display-name__html': {
        return caseDisplayNameHTML(target)
      }
      // search result account area
      case 'display-name': {
        return caseDisplayName(target)
      }
      // my screen name strong
      case 'navigation-bar__profile-account': {
        return caseNavigationProfileAccount(target)
      }
      case '': {
        if (target.tagName.toLowerCase() === 'strong') {
          return caseNoClassNameStrong(target)
        }
        return null
      }
      default: {
        return null
      }
    }
  })()

  if (!dataID) return console.debug('no dataID')
  const nowOpening = basename(window.location)
  if (nowOpening === dataID) return console.debug('already fetched')

  execReplace(dataID, ACCESS_TOKEN)
}
