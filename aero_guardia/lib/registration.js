export const REGISTRATION_PREFIX_OPTIONS = [
  { value: "XB-", label: "XB- · México (civil)" },
  { value: "XA-", label: "XA- · México" },
  { value: "XC-", label: "XC- · México" },
  { value: "N", label: "N · Estados Unidos" },
  { value: "C-", label: "C- · Canadá" },
  { value: "HP-", label: "HP- · Panamá" },
  { value: "TG-", label: "TG- · Guatemala" },
  { value: "CUSTOM", label: "Otro / personalizado" },
];

export function normalizeRegistrationPart(value = "") {
  return String(value).trim().toUpperCase().replace(/\s+/g, "");
}

export function buildRegistration(prefix, sequence, customPrefix = "") {
  const safeSequence = normalizeRegistrationPart(sequence);
  const safePrefix =
    prefix === "CUSTOM"
      ? normalizeRegistrationPart(customPrefix)
      : normalizeRegistrationPart(prefix);

  if (!safePrefix || !safeSequence) {
    return "";
  }

  return `${safePrefix}${safeSequence}`;
}

export function splitRegistrationHint(registration = "") {
  const value = normalizeRegistrationPart(registration);

  const known = REGISTRATION_PREFIX_OPTIONS.filter(
    (option) => option.value !== "CUSTOM"
  ).sort((a, b) => b.value.length - a.value.length);

  for (const option of known) {
    if (value.startsWith(option.value)) {
      return {
        prefix: option.value,
        customPrefix: "",
        sequence: value.slice(option.value.length),
      };
    }
  }

  const match = value.match(/^([A-Z]+-?)(.*)$/);

  if (match && match[2]) {
    return {
      prefix: "CUSTOM",
      customPrefix: match[1],
      sequence: match[2],
    };
  }

  return {
    prefix: "XB-",
    customPrefix: "",
    sequence: value,
  };
}
