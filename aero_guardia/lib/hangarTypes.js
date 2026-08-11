export const HANGAR_TYPE_OPTIONS = [
  {
    value: "mantenimiento",
    label: "Hangar de mantenimiento",
    image: "/Hangar_Mantenimiento.jpg",
    classification: "Mantenimiento",
  },
  {
    value: "escuela",
    label: "Escuela De Aviacion",
    image: "/Hangar_Escuela.jpg",
    classification: "Aviación General",
  },
  {
    value: "almacenamiento",
    label: "Hangar de almacenamiento",
    image: "/Hangar_Almacenamiento.jpg",
    classification: "Multipropósito",
  },
];

export function getHangarTypeConfig(hangarType) {
  return (
    HANGAR_TYPE_OPTIONS.find((option) => option.value === hangarType) ||
    HANGAR_TYPE_OPTIONS[0]
  );
}

export function resolveHangarVisualFields(hangarType) {
  const config = getHangarTypeConfig(hangarType);

  return {
    hangarType: config.value,
    zoneTitle: config.label,
    image: config.image,
    classification: config.classification,
  };
}
