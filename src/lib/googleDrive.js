// Stores the whole app state as a single JSON file inside the user's
// Drive "appDataFolder" — a hidden space Drive reserves per-app that is
// invisible in the user's normal Drive UI and only readable by this app.
// This costs the user nothing (counts against their own free Drive quota,
// usually 15GB) and costs you (the developer) nothing — no server involved.

import { requestDriveAccess } from './googleAuth'

const FILE_NAME = 'tally-data.json'
const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'

async function authHeaders() {
  const token = await requestDriveAccess()
  return { Authorization: `Bearer ${token}` }
}

async function findFileId() {
  const headers = await authHeaders()
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name='${FILE_NAME}'`,
    fields: 'files(id, name, modifiedTime)',
  })
  const res = await fetch(`${DRIVE_FILES}?${params}`, { headers })
  if (!res.ok) throw new Error('Could not reach Google Drive.')
  const data = await res.json()
  return data.files && data.files[0] ? data.files[0].id : null
}

export async function loadFromDrive() {
  const fileId = await findFileId()
  if (!fileId) return null
  const headers = await authHeaders()
  const res = await fetch(`${DRIVE_FILES}/${fileId}?alt=media`, { headers })
  if (!res.ok) throw new Error('Could not read your data from Drive.')
  return res.json()
}

export async function saveToDrive(dataObject) {
  const headers = await authHeaders()
  const fileId = await findFileId()
  const body = JSON.stringify(dataObject)

  if (fileId) {
    const res = await fetch(`${DRIVE_UPLOAD}/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body,
    })
    if (!res.ok) throw new Error('Could not save your data to Drive.')
    return res.json()
  }

  const metadata = { name: FILE_NAME, parents: ['appDataFolder'] }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', new Blob([body], { type: 'application/json' }))

  const res = await fetch(`${DRIVE_UPLOAD}?uploadType=multipart`, {
    method: 'POST',
    headers,
    body: form,
  })
  if (!res.ok) throw new Error('Could not create your data file in Drive.')
  return res.json()
}
