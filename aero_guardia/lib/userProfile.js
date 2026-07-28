export const MINIMUM_USER_AGE = 18;

export function normalizeUsername(value = "") {
  return value.trim().toLowerCase();
}

export function validateUsername(username) {
  const normalized = normalizeUsername(username);

  if (!normalized) {
    return "El nombre de usuario es obligatorio";
  }

  if (normalized.length < 3 || normalized.length > 24) {
    return "El nombre de usuario debe tener entre 3 y 24 caracteres";
  }

  if (!/^[a-z0-9_]+$/.test(normalized)) {
    return "Solo letras minúsculas, números y guion bajo";
  }

  return null;
}

export function isUserAdult(dateOfBirth) {
  if (!dateOfBirth) {
    return false;
  }

  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    return false;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age >= MINIMUM_USER_AGE;
}

export function buildDisplayName(firstNames = "", lastNames = "") {
  return [firstNames.trim(), lastNames.trim()].filter(Boolean).join(" ");
}

export function isProfileComplete(user) {
  if (!user) {
    return false;
  }

  return Boolean(
    user.username &&
      user.firstNames?.trim() &&
      user.lastNames?.trim() &&
      user.dateOfBirth &&
      isUserAdult(user.dateOfBirth)
  );
}

export function parseLoginIdentifier(identifier = "") {
  const value = identifier.trim();

  if (!value) {
    return { type: null, value: "" };
  }

  if (value.includes("@")) {
    return {
      type: "email",
      value: value.toLowerCase(),
    };
  }

  return {
    type: "username",
    value: normalizeUsername(value),
  };
}

export function formatDateInput(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().split("T")[0];
}

export function getUserDisplayLabel(user) {
  if (!user || typeof user === "string") {
    return "Usuario";
  }

  const fullName = buildDisplayName(user.firstNames, user.lastNames);

  return user.username || fullName || user.name || user.email || "Usuario";
}

export function formatHangarMember(entry) {
  const user = entry.user;
  const userId = user?._id?.toString() || user?.toString();

  return {
    userId,
    username: user?.username || "",
    name:
      buildDisplayName(user?.firstNames, user?.lastNames) || user?.name || "",
    displayLabel: getUserDisplayLabel(user),
    email: user?.email || "",
    role: entry.role,
    joinedAt: entry.joinedAt || null,
  };
}
