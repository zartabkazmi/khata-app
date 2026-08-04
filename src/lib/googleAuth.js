// Google Identity Services (GIS) auth — 100% free, no backend.
// Two things happen on sign-in:
//  1. A lightweight ID token login (for showing name/email/avatar)
//  2. An OAuth access token with the `drive.appdata` scope, so the app can
//     read/write ONE hidden file in the user's own Drive that only this app can see.
//
// Client ID comes from an env var so nothing sensitive is hard-coded.
// See README.md for how to create a free one in Google Cloud Console.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata'

let tokenClient = null
let accessToken = null
let accessTokenExpiry = 0

export function isConfigured() {
  return Boolean(CLIENT_ID)
}

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

/**
 * Renders the official "Sign in with Google" button into the given DOM node,
 * and resolves with { name, email, picture } once the user completes sign-in.
 */
export function renderSignInButton(container, onProfile) {
  if (!window.google || !CLIENT_ID) return

  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (response) => {
      const profile = decodeJwt(response.credential)
      if (profile) {
        onProfile({
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
        })
      }
    },
  })

  window.google.accounts.id.renderButton(container, {
    theme: 'outline',
    size: 'large',
    shape: 'pill',
    text: 'continue_with',
    width: 280,
  })
}

/**
 * Requests (or silently reuses) a Drive access token. Must be called from a
 * user gesture the first time (button click) — that's how Google's popup works.
 */
export function requestDriveAccess() {
  return new Promise((resolve, reject) => {
    if (accessToken && Date.now() < accessTokenExpiry) {
      resolve(accessToken)
      return
    }
    if (!window.google || !CLIENT_ID) {
      reject(new Error('Google Identity Services not loaded, or Client ID missing.'))
      return
    }
    if (!tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: () => {}, // overridden per-request below
      })
    }
    tokenClient.callback = (resp) => {
      if (resp.error) {
        reject(new Error(resp.error))
        return
      }
      accessToken = resp.access_token
      accessTokenExpiry = Date.now() + (resp.expires_in - 60) * 1000
      resolve(accessToken)
    }
    tokenClient.requestAccessToken({ prompt: '' })
  })
}

export function signOut() {
  if (accessToken && window.google) {
    window.google.accounts.oauth2.revoke(accessToken, () => {})
  }
  accessToken = null
  accessTokenExpiry = 0
  if (window.google) window.google.accounts.id.disableAutoSelect()
}
