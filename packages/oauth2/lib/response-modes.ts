import { URLSearchParams, URL } from 'url'

import {
  OAuth2HTMLResponse,
  OAuth2RedirectResponse,
  OAuth2Response
} from './context'

function form_post(
  redirectUri: string,
  data: Record<string, any>
): OAuth2HTMLResponse {
  const params = Object.entries(data).reduce(
    (inputs, [name, value]) =>
      (inputs += `<input type="hidden" name="${name}" value="${value}">`),
    ''
  )

  const body = String.raw`
  <!DOCTYPE html>
  <html lang="en-us">
  <head>
    <title>Authorizing...</title>
  </head>
  <body onload="document.forms[0].submit();">
    <form method="post" action="${redirectUri}">
      ${params}
    </form>
  </body>
  </html>
  `

  return new OAuth2HTMLResponse({ body })
}

function fragment(
  redirectUri: string,
  data: Record<string, any>
): OAuth2RedirectResponse {
  const url = new URL(redirectUri)
  const params = new URLSearchParams(data)

  url.hash = String(params)

  return new OAuth2RedirectResponse({ url: url.href })
}

function query(
  redirectUri: string,
  data: Record<string, any>
): OAuth2RedirectResponse {
  const url = new URL(redirectUri)

  Object.entries(data).forEach(([name, value]) =>
    url.searchParams.set(name, String(value))
  )

  return new OAuth2RedirectResponse({ url: url.href })
}

export type ResponseMode = (
  redirectUri: string,
  data: Record<string, any>
) => OAuth2Response

export const ResponseModes: Record<string, ResponseMode> = {
  form_post,
  fragment,
  query
}
