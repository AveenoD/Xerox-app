// Allowed Email Domains (Whitelist)
// Only emails from these domains can register

export const ALLOWED_EMAIL_DOMAINS = [
  // Major free email providers
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'apple.com',
  'aol.com',

  // Privacy-focused
  'protonmail.com',
  'proton.me',
  'tutanota.com',
  'hey.com',
  'fastmail.com',

  // Other popular
  'zoho.com',
  'mail.com',
  'gmx.com',
  'gmx.net',
  'yandex.com',
  'yandex.in',
  'rediffmail.com',
  'inbox.com',

  // Microsoft 365 / Office
  'office.com',
  'microsoft.com',

  // Education
  'edu.in',
  'ac.in',
  'edu',

  // Business (common)
  'outlook.in',
  'yahoo.co.in',
] as const;

// Blocked Email Domains (Blacklist)
// Disposable/temporary email services

export const BLOCKED_EMAIL_DOMAINS = [
  // Common disposable email services
  'tempmail.com',
  'temp-mail.org',
  'throwaway.email',
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamailblock.com',
  '10minutemail.com',
  '10minutemail.net',
  'fakeinbox.com',
  'trashmail.com',
  'dispostable.com',
  'yopmail.com',
  'getnada.com',
  'mintemail.com',
  'sharklasers.com',
  'grr.la',
  'spam4.me',
  'spamgourmet.com',
  'tempail.com',
  'discard.email',
  'discardmail.com',
  'mailnesia.com',
  'maildrop.cc',
  'getairmail.com',
  'mohmal.com',
  'fakemailgenerator.com',
  'throwawaymail.com',
  'burnermail.io',
  'mailsac.com',
  'mytemp.email',
  'emailfake.com',
  'tempinbox.com',
  'tempr.email',
  'disposableemailaddresses.com',
  'anti-spam.world',
  'letthemeatspam.com',
  'safetymail.info',
  'spamfree24.org',
  'jetable.org',
  'mailnull.com',
  'spamherelots.com',
  'devnullmail.com',
  'spambox.us',
  'tempmailo.com',
  'emailondeck.com',
  'emailtemporario.com.br',
  'dropmail.me',
  'tempemailco.com',
  'fakeinbox.org',
  'inboxalias.com',
  'jetable.fr.nf',
  'mailforspam.com',
  'tempemail.net',
  'tempmailaddress.com',
  'temporaryemail.net',
  'temporaryemail.us',
  'throwawaymail.com',
  'tmpmail.org',
  'tmpmail.net',
  'anonymbox.com',
  'getonemail.com',
  'getonemail.net',
  'haltospam.com',
  'e4ward.com',
  'spamex.com',
  'mailnull.com',
  'yopmail.pp.ua',
  'cool.fr.nf',
  'dodgeit.com',
  'dodgit.com',
  'spamcowboy.com',
  'spamcowboy.net',
  'spamcowboy.org',
  'spamfree.eu',
] as const;

// Check if email domain is allowed
export const isEmailAllowed = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;

  // Check blocked list first (fastest rejection)
  if (BLOCKED_EMAIL_DOMAINS.includes(domain as typeof BLOCKED_EMAIL_DOMAINS[number])) {
    return false;
  }

  // Check allowed list
  return ALLOWED_EMAIL_DOMAINS.includes(domain as typeof ALLOWED_EMAIL_DOMAINS[number]);
};

// Get blocked domain reason
export const getBlockedDomainReason = (email: string): string | null => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return 'Email format invalid';

  if (BLOCKED_EMAIL_DOMAINS.includes(domain as typeof BLOCKED_EMAIL_DOMAINS[number])) {
    return 'Temporary/disposable email addresses are not allowed. Please use a valid email provider.';
  }

  if (!ALLOWED_EMAIL_DOMAINS.includes(domain as typeof ALLOWED_EMAIL_DOMAINS[number])) {
    return `Email domain "${domain}" is not supported. Please use Gmail, Yahoo, Outlook, or other major email providers.`;
  }

  return null;
};
