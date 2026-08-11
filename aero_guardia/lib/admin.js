function normalizeEmail(email) {
  return email?.trim().toLowerCase() || "";
}

export function getAdminEmails() {
  const rawEmails = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "";

  return rawEmails
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

export function isAdminEmail(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return false;
  }

  return getAdminEmails().includes(normalizedEmail);
}
