export const PROFILE_ID = '00000000-0000-0000-0000-000000000001'
export const DEFAULT_LOGIN_EMAIL = 'dmmsb19@gmail.com'
export const DEFAULT_APP_PASSWORD = '123456'

export type Profile = {
  id: string
  display_name: string
  job_title: string
  bio: string
  professional_email: string
  phone: string
  linkedin_url: string
  instagram_url: string
  website_url: string
  avatar_url: string
  logo_url: string
  accent_color: string
  theme: 'light' | 'dark' | 'system'
  timezone: string
  language: 'pt' | 'en'
  login_email: string
  updated_at?: string
}

export const defaultProfile: Profile = {
  id: PROFILE_ID,
  display_name: 'DM Recruiter',
  job_title: 'Especialista em Pessoas & Recrutamento',
  bio: 'Conectando talentos e oportunidades com estratégia e cuidado.',
  professional_email: DEFAULT_LOGIN_EMAIL,
  phone: '',
  linkedin_url: '',
  instagram_url: '',
  website_url: '',
  avatar_url: '',
  logo_url: '',
  accent_color: '#695cff',
  theme: 'light',
  timezone: 'America/Sao_Paulo',
  language: 'pt',
  login_email: DEFAULT_LOGIN_EMAIL,
}

export async function passwordDigest(password: string) {
  const bytes = new TextEncoder().encode(`dm-recruit-v2:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character)
}

function safeUrl(value: string) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? escapeHtml(url.toString()) : ''
  } catch { return '' }
}

export function buildSignature(profile: Profile) {
  const accent = /^#[0-9a-f]{6}$/i.test(profile.accent_color) ? profile.accent_color : '#695cff'
  const phone = escapeHtml(profile.phone)
  const email = escapeHtml(profile.professional_email)
  const avatar = safeUrl(profile.avatar_url)
  const linkedin = safeUrl(profile.linkedin_url)
  const website = safeUrl(profile.website_url)
  const links = [
    phone && `<a href="tel:${profile.phone.replace(/[^+\d]/g, '')}" style="color:${accent};text-decoration:none">${phone}</a>`,
    linkedin && `<a href="${linkedin}" style="color:${accent};text-decoration:none">LinkedIn</a>`,
    website && `<a href="${website}" style="color:${accent};text-decoration:none">Website</a>`,
  ].filter(Boolean).join(' &nbsp;·&nbsp; ')
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="font-family:Arial,sans-serif;color:#1f2937"><tr>${avatar ? `<td style="padding-right:14px"><img src="${avatar}" alt="" width="64" height="64" style="width:64px;height:64px;border-radius:16px;object-fit:cover"></td>` : ''}<td style="border-left:3px solid ${accent};padding-left:14px"><strong style="font-size:16px">${escapeHtml(profile.display_name)}</strong><br><span style="color:#667085;font-size:13px">${escapeHtml(profile.job_title)}</span>${profile.bio ? `<br><span style="color:#98a2b3;font-size:12px">${escapeHtml(profile.bio)}</span>` : ''}<br><a href="mailto:${email}" style="color:${accent};font-size:12px;text-decoration:none">${email}</a>${links ? `<br><span style="font-size:12px">${links}</span>` : ''}</td></tr></table>`
}
