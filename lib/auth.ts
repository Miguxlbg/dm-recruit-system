const encoder = new TextEncoder()

export async function sessionToken() {
  const password = process.env.APP_PASSWORD || ''
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`dm-system-recruit:${password}`))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export const SESSION_COOKIE = 'dm_people_session'
