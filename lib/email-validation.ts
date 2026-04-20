// Email domain validation and role assignment utilities

export const ALLOWED_EMAIL_DOMAINS = [
  'nadra.gov.pk',
  'pta.gov.pk',
  'ptcl.net.pk',
  'zong.com.pk',
  'jazz.com.pk',
  'ufone.com'
] as const

export type AdminRole = 'NADRA' | 'PTA' | 'TELCO'

export interface EmailValidationResult {
  isValid: boolean
  domain: string | null
  role: AdminRole | null
  error?: string
}

/**
 * Validates email domain and assigns role automatically
 */
export function validateEmailDomain(email: string): EmailValidationResult {
  if (!email || !email.includes('@')) {
    return {
      isValid: false,
      domain: null,
      role: null,
      error: 'Invalid email format'
    }
  }

  const domain = email.split('@')[1]?.toLowerCase()

  if (!domain) {
    return {
      isValid: false,
      domain: null,
      role: null,
      error: 'Invalid email format'
    }
  }

  if (!ALLOWED_EMAIL_DOMAINS.includes(domain as any)) {
    return {
      isValid: false,
      domain,
      role: null,
      error: 'Invalid email domain. Only government and telecom domains are allowed.'
    }
  }

  // Assign role based on domain
  let role: AdminRole
  if (domain === 'nadra.gov.pk') {
    role = 'NADRA'
  } else if (domain === 'pta.gov.pk') {
    role = 'PTA'
  } else {
    role = 'TELCO'
  }

  return {
    isValid: true,
    domain,
    role
  }
}

/**
 * Get role display label
 */
export function getRoleLabel(role: AdminRole): string {
  switch (role) {
    case 'NADRA':
      return 'NADRA Admin'
    case 'PTA':
      return 'PTA Admin'
    case 'TELCO':
      return 'TELCO Admin'
    default:
      return 'Admin'
  }
}

/**
 * Get role logo path
 */
export function getRoleLogo(role: AdminRole): string | null {
  switch (role) {
    case 'NADRA':
      return '/logos/nadralogo.png'
    case 'PTA':
      return '/logos/ptalogo.png'
    case 'TELCO':
      return null
    default:
      return null
  }
}