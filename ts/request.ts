import { Window } from './types/deftype'

declare var window: Window
type RESPONCE_TYPE = '' | 'arraybuffer' | 'blob' | 'document' | 'json' | 'text'

interface IRequestOptions {
  // headers?: Headers
  timeout?: number
  responseType?: RESPONCE_TYPE
  // withCredentials?: boolean
}

interface IXMLHTTPResponse {
  ok: boolean
  status: number
  statusText: string
  text: () => Promise<string>
  json: <T>() => Promise<T>
}

const toResponse = (xhr: XMLHttpRequest): IXMLHTTPResponse => {
  const response: IXMLHTTPResponse = {
    json: () => new Promise((resolve, _) => resolve(xhr.response)),
    ok: xhr.status >= 200 && xhr.status < 300,
    status: xhr.status,
    statusText: xhr.statusText,
    text: () => new Promise((resolve, _) => resolve(xhr.response as typeof xhr.responseType))
  }
  return response
}

export const fetch = (arg: Request | string, options?: IRequestOptions): Promise<IXMLHTTPResponse> => {
  const request = typeof arg === 'string' ? new Request(arg) : arg
  return new Promise((resolve, reject) => {
    const xhr = new window.XMLHttpRequest()

    xhr.open(request.method, request.url)
    for (const [key, value] of request.headers) {
      xhr.setRequestHeader(key, value)
    }

    if (request.credentials !== 'omit') xhr.withCredentials = true
    if (options) {
      if (options.responseType) xhr.responseType = options.responseType
      if (options.timeout) xhr.timeout = options.timeout
    }

    xhr.onloadend = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(toResponse(xhr))
      } else {
        reject(toResponse(xhr))
      }
    }

    xhr.onerror = () => {
      reject(toResponse(xhr))
    }

    xhr.send()
  })
}

export const getAccountPage = (displayName: string): Promise<IXMLHTTPResponse> => {
  return fetch(`${window.origin}/${displayName}`)
}

export const getAccounts = (dataID: string, accessToken: string): Promise<IXMLHTTPResponse> => {
  const headers = new Headers()
  headers.append('Authorization', `Bearer ${accessToken}`)
  const init: RequestInit = {
    credentials: 'include',
    headers
  }
  const options: IRequestOptions = {
    responseType: 'json'
  }
  const request = new Request(`${window.origin}/api/v1/accounts/${dataID}`, init)
  return fetch(request, options)
}
