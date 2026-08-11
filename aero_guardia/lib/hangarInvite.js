import { nanoid } from "nanoid";

export const INVITE_CODE_TTL_MS = 24 * 60 * 60 * 1000;

export function generateInviteCode() {
  return nanoid(8).toUpperCase();
}

export function getInviteCodeExpiryDate() {
  return new Date(Date.now() + INVITE_CODE_TTL_MS);
}

export function isInviteCodeVisible(hangar) {
  if (!hangar?.inviteCodeExpiresAt) {
    return false;
  }

  return new Date(hangar.inviteCodeExpiresAt).getTime() > Date.now();
}

export function isInviteCodeExpired(hangar) {
  if (!hangar?.inviteCodeExpiresAt) {
    return false;
  }

  return new Date(hangar.inviteCodeExpiresAt).getTime() <= Date.now();
}

export function formatInviteExpiry(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
