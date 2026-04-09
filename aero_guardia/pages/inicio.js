import Link from "next/link";
import Image from "next/image";
import { Roboto_Condensed } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import Header from "@/Components/common/Header";

const roboto_condensed = Roboto_Condensed({ weight: ['400', '700'], subsets: ['latin'] });

const sectionTemplates = [
  {
    title: "Operaciones",
    description: "Panel de control de operaciones del hangar.",
    tab: "operaciones",
    hoverShadow: "hover:shadow-cyan-400/70",
  },
  {
    title: "Incidentes",
    description: "Registro rapido de novedades y eventos de seguridad.",
    tab: "incidentes",
    hoverShadow: "hover:shadow-rose-400/70",
  },
  {
    title: "Reportes",
    description: "Resumen diario con metricas y tareas pendientes.",
    tab: "reportes",
    hoverShadow: "hover:shadow-amber-400/70",
  },
  {
    title: "Mantenimiento",
    description: "Calendario tecnico y checklist de aeronaves.",
    tab: "mantenimiento",
    hoverShadow: "hover:shadow-emerald-400/70",
  },
];

const HANGAR_TYPE_OPTIONS = [
  {
    value: "mantenimiento",
    label: "Hangar de mantenimiento",
    image: "/Hangar_Mantenimiento.jpg",
  },
  {
    value: "escuela",
    label: "Escuela De Aviacion",
    image: "/Hangar_Escuela.jpg",
  },
  {
    value: "almacenamiento",
    label: "Hangar de almacenamiento",
    image: "/Hangar_Almacenamiento.jpg",
  },
];

const getHangarTypeConfig = (hangarType) =>
  HANGAR_TYPE_OPTIONS.find((option) => option.value === hangarType) || HANGAR_TYPE_OPTIONS[0];

const inferHangarTypeFromImage = (image) => {
  const normalizedImage = (image || "").toLowerCase();

  const match = HANGAR_TYPE_OPTIONS.find((option) => option.image.toLowerCase() === normalizedImage);
  return match ? match.value : HANGAR_TYPE_OPTIONS[0].value;
};

const INITIAL_HANGARS = [
  {
    id: "hangar-1",
    label: "Hangar Principal",
    location: "Terminal Norte",
    description: "Zona principal para aeronaves de linea.",
    hangarType: "mantenimiento",
    zoneTitle: "Hangar de mantenimiento",
    image: "/Hangar_Mantenimiento.jpg",
    aircraftList: [
      { id: "AG-101", model: "Boeing 737-800", status: "Listo" },
      { id: "AG-224", model: "Airbus A320", status: "En revision" },
      { id: "AG-315", model: "Cessna 208", status: "En mantenimiento" },
      { id: "AG-402", model: "Embraer 190", status: "Listo" },
    ],
  },
];

export default function Inicio() {
  const [hangars, setHangars] = useState(INITIAL_HANGARS);
  const hasLoadedFromApi = useRef(false);
  const [isAddHangarModalOpen, setIsAddHangarModalOpen] = useState(false);
  const [newHangar, setNewHangar] = useState({
    label: "",
    location: "",
    description: "",
    hangarType: HANGAR_TYPE_OPTIONS[0].value,
  });
  const [aircraftDrafts, setAircraftDrafts] = useState({});
  const [editingHangarId, setEditingHangarId] = useState(null);
  const [hangarDraft, setHangarDraft] = useState({
    label: "",
    location: "",
    description: "",
    hangarType: HANGAR_TYPE_OPTIONS[0].value,
  });
  const [editingAircraft, setEditingAircraft] = useState({ hangarId: null, aircraftId: null });
  const [editingAircraftDraft, setEditingAircraftDraft] = useState({ id: "", model: "", status: "" });

  useEffect(() => {
    let isMounted = true;

    const loadHangars = async () => {
      try {
        const response = await fetch("/api/hangars");
        if (!response.ok) {
          throw new Error("Failed to load hangars");
        }

        const data = await response.json();
        if (isMounted && Array.isArray(data?.hangars)) {
          setHangars(data.hangars);
        }
      } catch {
        if (isMounted) {
          setHangars(INITIAL_HANGARS);
        }
      } finally {
        if (isMounted) {
          hasLoadedFromApi.current = true;
        }
      }
    };

    loadHangars();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedFromApi.current) {
      return;
    }

    const controller = new AbortController();

    const persistHangars = async () => {
      try {
        await fetch("/api/hangars", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ hangars }),
          signal: controller.signal,
        });
      } catch {
        // Ignore network errors here; local UI state remains responsive.
      }
    };

    persistHangars();

    return () => {
      controller.abort();
    };
  }, [hangars]);

  const buildId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const handleNewHangarChange = (field, value) => {
    setNewHangar((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddHangar = (event) => {
    event.preventDefault();

    const label = newHangar.label.trim();
    const location = newHangar.location.trim();
    const description = newHangar.description.trim();
    const hangarType = newHangar.hangarType;
    const selectedType = getHangarTypeConfig(hangarType);

    if (!label || !location) {
      return;
    }

    const createdHangar = {
      id: buildId("hangar"),
      label,
      location,
      description,
      hangarType,
      zoneTitle: selectedType.label,
      image: selectedType.image,
      aircraftList: [],
    };

    setHangars((prev) => [createdHangar, ...prev]);
    setNewHangar({
      label: "",
      location: "",
      description: "",
      hangarType: HANGAR_TYPE_OPTIONS[0].value,
    });
    setIsAddHangarModalOpen(false);
  };

  const handleDeleteHangar = (hangarId) => {
    setHangars((prev) => prev.filter((hangar) => hangar.id !== hangarId));
    if (editingHangarId === hangarId) {
      setEditingHangarId(null);
      setHangarDraft({
        label: "",
        location: "",
        description: "",
        hangarType: HANGAR_TYPE_OPTIONS[0].value,
      });
    }
    if (editingAircraft.hangarId === hangarId) {
      setEditingAircraft({ hangarId: null, aircraftId: null });
      setEditingAircraftDraft({ id: "", model: "", status: "" });
    }
    setAircraftDrafts((prev) => {
      const next = { ...prev };
      delete next[hangarId];
      return next;
    });
  };

  const handleStartEditHangar = (hangar) => {
    setEditingHangarId(hangar.id);
    setHangarDraft({
      label: hangar.label,
      location: hangar.location || "",
      description: hangar.description || "",
      hangarType: hangar.hangarType || inferHangarTypeFromImage(hangar.image),
    });
  };

  const handleHangarDraftChange = (field, value) => {
    setHangarDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveHangar = (event, hangarId) => {
    event.preventDefault();

    const label = hangarDraft.label.trim();
    const location = hangarDraft.location.trim();
    const description = hangarDraft.description.trim();
    const hangarType = hangarDraft.hangarType;
    const selectedType = getHangarTypeConfig(hangarType);

    if (!label || !location) {
      return;
    }

    setHangars((prev) =>
      prev.map((hangar) =>
        hangar.id === hangarId
          ? {
              ...hangar,
              label,
              location,
              description,
              hangarType,
              zoneTitle: selectedType.label,
              image: selectedType.image,
            }
          : hangar
      )
    );

    setEditingHangarId(null);
    setHangarDraft({
      label: "",
      location: "",
      description: "",
      hangarType: HANGAR_TYPE_OPTIONS[0].value,
    });
  };

  const handleCancelHangarEdit = () => {
    setEditingHangarId(null);
    setHangarDraft({
      label: "",
      location: "",
      description: "",
      hangarType: HANGAR_TYPE_OPTIONS[0].value,
    });
  };

  const handleAircraftDraftChange = (hangarId, field, value) => {
    setAircraftDrafts((prev) => ({
      ...prev,
      [hangarId]: {
        id: prev[hangarId]?.id || "",
        model: prev[hangarId]?.model || "",
        status: prev[hangarId]?.status || "",
        [field]: value,
      },
    }));
  };

  const handleAddAircraft = (event, hangarId) => {
    event.preventDefault();

    const draft = aircraftDrafts[hangarId] || { id: "", model: "", status: "" };
    const id = draft.id.trim() || buildId("AG").toUpperCase();
    const model = draft.model.trim();
    const status = draft.status.trim() || "Pendiente";

    if (!model) {
      return;
    }

    const newAircraft = { id, model, status };

    setHangars((prev) =>
      prev.map((hangar) =>
        hangar.id === hangarId
          ? { ...hangar, aircraftList: [newAircraft, ...hangar.aircraftList] }
          : hangar
      )
    );

    setAircraftDrafts((prev) => ({
      ...prev,
      [hangarId]: { id: "", model: "", status: "" },
    }));
  };

  const handleDeleteAircraft = (hangarId, aircraftId) => {
    if (editingAircraft.hangarId === hangarId && editingAircraft.aircraftId === aircraftId) {
      setEditingAircraft({ hangarId: null, aircraftId: null });
      setEditingAircraftDraft({ id: "", model: "", status: "" });
    }

    setHangars((prev) =>
      prev.map((hangar) =>
        hangar.id === hangarId
          ? {
              ...hangar,
              aircraftList: hangar.aircraftList.filter((aircraft) => aircraft.id !== aircraftId),
            }
          : hangar
      )
    );
  };

  const handleStartEditAircraft = (hangarId, aircraft) => {
    setEditingAircraft({ hangarId, aircraftId: aircraft.id });
    setEditingAircraftDraft({
      id: aircraft.id,
      model: aircraft.model,
      status: aircraft.status,
    });
  };

  const handleEditingAircraftDraftChange = (field, value) => {
    setEditingAircraftDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancelAircraftEdit = () => {
    setEditingAircraft({ hangarId: null, aircraftId: null });
    setEditingAircraftDraft({ id: "", model: "", status: "" });
  };

  const handleSaveAircraft = (event, hangarId, currentAircraftId) => {
    event.preventDefault();

    const id = editingAircraftDraft.id.trim();
    const model = editingAircraftDraft.model.trim();
    const status = editingAircraftDraft.status.trim() || "Pendiente";

    if (!id || !model) {
      return;
    }

    setHangars((prev) =>
      prev.map((hangar) => {
        if (hangar.id !== hangarId) {
          return hangar;
        }

        return {
          ...hangar,
          aircraftList: hangar.aircraftList.map((aircraft) =>
            aircraft.id === currentAircraftId
              ? { ...aircraft, id, model, status }
              : aircraft
          ),
        };
      })
    );

    setEditingAircraft({ hangarId: null, aircraftId: null });
    setEditingAircraftDraft({ id: "", model: "", status: "" });
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-slate-100 px-5 py-35 pb-6 text-slate-900 sm:px-8 md:px-12">
      <div className="w-screen h-auto flex flex-col items-center justify-center mb-4 fixed top-0 left-0 z-50">
        <Header/>
      </div>
      
    
      <main className="mx-auto w-full max-w-6xl space-y-8">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className={`text-xl font-bold text-slate-800 ${roboto_condensed.className}`}>Gestion de hangares</h2>
            <button
              type="button"
              onClick={() => setIsAddHangarModalOpen(true)}
              className={`rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 ${roboto_condensed.className}`}
            >
              Agregar hangar
            </button>
          </div>
        </section>

        {isAddHangarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
            <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
              <h3 className={`mb-4 text-lg font-bold text-slate-900 ${roboto_condensed.className}`}>Nuevo hangar</h3>
              <form onSubmit={handleAddHangar} className="grid grid-cols-1 gap-3">
                <input
                  value={newHangar.label}
                  onChange={(event) => handleNewHangarChange("label", event.target.value)}
                  placeholder="Nombre del hangar"
                  className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                />
                <input
                  value={newHangar.location}
                  onChange={(event) => handleNewHangarChange("location", event.target.value)}
                  placeholder="Ubicacion"
                  className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                />
                <textarea
                  value={newHangar.description}
                  onChange={(event) => handleNewHangarChange("description", event.target.value)}
                  placeholder="Descripcion (opcional)"
                  rows={3}
                  className={`resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                />
                <select
                  value={newHangar.hangarType}
                  onChange={(event) => handleNewHangarChange("hangarType", event.target.value)}
                  className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                >
                  {HANGAR_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className={`rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 ${roboto_condensed.className}`}
                  >
                    Guardar hangar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddHangarModalOpen(false)}
                    className={`rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {hangars.map((hangar) => (
          <section key={hangar.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-52 w-full sm:h-64">
              <Image
                src={hangar.image}
                alt={`Vista de ${hangar.label}`}
                fill
                sizes="(max-width: 640px) 100vw, 1200px"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/70 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white sm:bottom-6 sm:left-6">
                <p className={`text-xs uppercase tracking-[0.2em] text-slate-200 ${roboto_condensed.className}`}>{hangar.zoneTitle}</p>
                <h2 className={`text-xl font-semibold sm:text-2xl ${roboto_condensed.className}`}>{hangar.label}</h2>
                <p className={`text-sm text-slate-100 ${roboto_condensed.className}`}>{hangar.location || "Sin ubicacion"}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteHangar(hangar.id)}
                className={`absolute right-3 top-3 rounded-md bg-red-600/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur transition hover:bg-red-700 ${roboto_condensed.className}`}
              >
                Borrar hangar
              </button>
              <Link
                href={`/hangar/${hangar.id}`}
                className={`absolute right-28 top-3 rounded-md bg-cyan-600/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur transition hover:bg-cyan-700 ${roboto_condensed.className}`}
              >
                Ver hangar
              </Link>
              <button
                type="button"
                onClick={() => handleStartEditHangar(hangar)}
                className={`absolute right-52 top-3 rounded-md bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur transition hover:bg-black ${roboto_condensed.className}`}
              >
                Editar hangar
              </button>
            </div>

            {editingHangarId === hangar.id && (
              <div className="border-t border-slate-200 px-4 py-4">
                <form onSubmit={(event) => handleSaveHangar(event, hangar.id)} className="grid grid-cols-1 gap-3 md:grid-cols-5">
                  <input
                    value={hangarDraft.label}
                    onChange={(event) => handleHangarDraftChange("label", event.target.value)}
                    placeholder="Nombre del hangar"
                    className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                  />
                  <input
                    value={hangarDraft.location}
                    onChange={(event) => handleHangarDraftChange("location", event.target.value)}
                    placeholder="Ubicacion"
                    className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                  />
                  <textarea
                    value={hangarDraft.description}
                    onChange={(event) => handleHangarDraftChange("description", event.target.value)}
                    placeholder="Descripcion (opcional)"
                    rows={2}
                    className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                  />
                  <select
                    value={hangarDraft.hangarType}
                    onChange={(event) => handleHangarDraftChange("hangarType", event.target.value)}
                    className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                  >
                    {HANGAR_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className={`rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 ${roboto_condensed.className}`}
                  >
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelHangarEdit}
                    className={`rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
                  >
                    Cancelar
                  </button>
                </form>
              </div>
            )}

            {hangar.description && (
              <div className="border-t border-slate-200 px-4 py-3">
                <p className={`text-sm text-slate-600 ${roboto_condensed.className}`}>{hangar.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              {hangar.aircraftList.map((aircraft) => (
                <article key={`${hangar.id}-${aircraft.id}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-xs font-semibold uppercase text-slate-500 ${roboto_condensed.className}`}>{aircraft.id}</p>
                      <p className={`text-sm font-medium text-slate-800 ${roboto_condensed.className}`}>{aircraft.model}</p>
                      <p className={`text-xs text-slate-600 ${roboto_condensed.className}`}>Estado: {aircraft.status}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditAircraft(hangar.id, aircraft)}
                        className={`rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAircraft(hangar.id, aircraft.id)}
                        className={`rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-200 ${roboto_condensed.className}`}
                      >
                        Borrar
                      </button>
                    </div>
                  </div>

                  {editingAircraft.hangarId === hangar.id && editingAircraft.aircraftId === aircraft.id && (
                    <form onSubmit={(event) => handleSaveAircraft(event, hangar.id, aircraft.id)} className="mt-3 grid grid-cols-1 gap-2">
                      <input
                        value={editingAircraftDraft.id}
                        onChange={(event) => handleEditingAircraftDraftChange("id", event.target.value)}
                        placeholder="Codigo"
                        className={`rounded-md border border-slate-300 px-2 py-1 text-xs outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                      />
                      <input
                        value={editingAircraftDraft.model}
                        onChange={(event) => handleEditingAircraftDraftChange("model", event.target.value)}
                        placeholder="Modelo"
                        className={`rounded-md border border-slate-300 px-2 py-1 text-xs outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                      />
                      <input
                        value={editingAircraftDraft.status}
                        onChange={(event) => handleEditingAircraftDraftChange("status", event.target.value)}
                        placeholder="Estado"
                        className={`rounded-md border border-slate-300 px-2 py-1 text-xs outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className={`rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700 ${roboto_condensed.className}`}
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelAircraftEdit}
                          className={`rounded-md bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              ))}
            </div>

            <div className="border-t border-slate-200 px-4 py-4">
              <form onSubmit={(event) => handleAddAircraft(event, hangar.id)} className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <input
                  value={aircraftDrafts[hangar.id]?.id || ""}
                  onChange={(event) => handleAircraftDraftChange(hangar.id, "id", event.target.value)}
                  placeholder="Codigo (opcional)"
                  className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                />
                <input
                  value={aircraftDrafts[hangar.id]?.model || ""}
                  onChange={(event) => handleAircraftDraftChange(hangar.id, "model", event.target.value)}
                  placeholder="Modelo de avion"
                  className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                />
                <input
                  value={aircraftDrafts[hangar.id]?.status || ""}
                  onChange={(event) => handleAircraftDraftChange(hangar.id, "status", event.target.value)}
                  placeholder="Estado (opcional)"
                  className={`rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                />
                <button
                  type="submit"
                  className={`rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 ${roboto_condensed.className}`}
                >
                  Agregar avion
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {sectionTemplates.map((section) => (
                <Link
                  key={`${hangar.id}-${section.title}`}
                  href={`/inicio?hangar=${hangar.id}&tab=${section.tab}`}
                  className={`group rounded-xl border border-slate-200 bg-white p-5 shadow-md transition duration-300 hover:scale-[1.03] hover:shadow-xl ${section.hoverShadow} ${roboto_condensed.className}`}
                >
                  <h3 className="mb-2 text-lg font-semibold text-slate-800">{section.title}</h3>
                  <p className="text-sm text-slate-600">{section.description}</p>
                  <span className="mt-4 inline-block text-sm font-medium text-slate-700 transition group-hover:text-slate-900">
                    Abrir apartado
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}