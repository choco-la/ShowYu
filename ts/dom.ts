import { isHTMLElem } from './types/typeguards'

export const getAncestor = (me: HTMLElement, count: number = 1): HTMLElement => {
  const result = me.parentNode
  if (!isHTMLElem(result)) throw new Error('no such a parentNode found')

  if (count === 1) {
    return result
  } else {
    return getAncestor(result, count - 1)
  }
}
