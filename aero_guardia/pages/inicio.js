import Link from "next/link";
import { useSession } from "next-auth/react";
import { Roboto_Condensed } from "next/font/google";
import { Jersey_10 } from '@next/font/google';
import { useEffect, useRef, useState } from "react";
import Header from "@/Components/common/Header";
import { IoMenu } from "react-icons/io5";
import { FaPlus } from "react-icons/fa6";
import { FaPlane } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";
import { RiAlarmWarningFill } from "react-icons/ri";
import { FaPlaneLock } from "react-icons/fa6";



const roboto_condensed = Roboto_Condensed({ weight: ['400', '700'], subsets: ['latin'] });
const jersey_10 = Jersey_10({ weight: '400', subsets: ['latin'] });


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
  const { status } = useSession();
  const canManageHangars = status === "authenticated";
  const [hangars, setHangars] = useState(INITIAL_HANGARS);
  const hasLoadedFromApi = useRef(false);
  const [isAddHangarModalOpen, setIsAddHangarModalOpen] = useState(false);
  const [newHangar, setNewHangar] = useState({
    label: "",
    location: "",
    description: "",
    hangarType: HANGAR_TYPE_OPTIONS[0].value,
  });
  const [editingHangarId, setEditingHangarId] = useState(null);
  const [hangarMenuOpenId, setHangarMenuOpenId] = useState(null);
  const [confirmDeleteHangarId, setConfirmDeleteHangarId] = useState(null);
  const [hangarDraft, setHangarDraft] = useState({
    label: "",
    location: "",
    description: "",
    hangarType: HANGAR_TYPE_OPTIONS[0].value,
  });

  useEffect(() => {
    if (!canManageHangars) {
      return;
    }

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
  }, [canManageHangars]);

  useEffect(() => {
    if (!canManageHangars) {
      return;
    }

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
  }, [hangars, canManageHangars]);

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
    if (hangarMenuOpenId === hangarId) {
      setHangarMenuOpenId(null);
    }
    if (editingHangarId === hangarId) {
      setEditingHangarId(null);
      setHangarDraft({
        label: "",
        location: "",
        description: "",
        hangarType: HANGAR_TYPE_OPTIONS[0].value,
      });
    }
  };

  const handleToggleHangarMenu = (hangarId) => {
    setHangarMenuOpenId((prev) => (prev === hangarId ? null : hangarId));
  };

  const handleRequestDeleteHangar = (hangarId) => {
    setConfirmDeleteHangarId(hangarId);
    setHangarMenuOpenId(null);
  };

  const handleConfirmDeleteHangar = () => {
    if (!confirmDeleteHangarId) {
      return;
    }

    handleDeleteHangar(confirmDeleteHangarId);
    setConfirmDeleteHangarId(null);
  };

  const hangarPendingDelete = hangars.find((hangar) => hangar.id === confirmDeleteHangarId) || null;

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

  if (!canManageHangars) {
    return (
      <div className="min-h-screen w-full bg-white text-slate-900">
        <div className="fixed left-0 top-0 z-50 w-screen">
          <Header />
        </div>

        <main className="mx-auto flex min-h-screen w-full items-center justify-center px-3 sm:px-6">
          <section className="flex flex-col lg:flex-row items-stretch justify-center w-11/12 sm:w-10/12 md:w-9/12 lg:w-8/12 xl:w-7/12 h-auto lg:h-1/2 overflow-hidden rounded-2xl sm:rounded-3xl border 
          border-slate-200 shadow-2xl p-4 sm:p-5 md:p-6 gap-4 sm:gap-6">

            <div className="w-full lg:w-1/2 h-32 sm:h-40 md:h-48 lg:h-full flex items-center justify-center">
              <FaPlaneLock size={120} className="sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-96 lg:h-96 text-black" />
            </div>

            <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start justify-center gap-2 sm:gap-3 md:gap-4">
              <h1 className={`text-3xl sm:text-4xl md:text-5xl text-black text-center lg:text-left ${jersey_10.className}`}>
                AeroGuardia
              </h1>
              <p className={`mb-3 sm:mb-4 md:mb-5 text-sm sm:text-base md:text-lg text-center lg:text-left ${roboto_condensed.className}`}>
                Gestiona tus hangares, controla accesos y mantén toda la información de tus aeronaves en un solo lugar.
                Inicia sesión para acceder a tu panel y llevar el control total de tu operación
              </p>
              <Link
                href="/"
                className={`inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 sm:px-5 md:px-6 py-2 sm:py-3 text-sm sm:text-base md:text-lg
                  font-semibold text-white transition hover:bg-blue-800 ${roboto_condensed.className}`}
              >
                Ir al inicio de sesion
              </Link>

            </div>




          </section>
        </main>

      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-slate-100 px-3 sm:px-4 md:px-6 lg:px-8 py-8 pb-6 text-slate-900 pt-24 sm:pt-28 md:pt-32 lg:pt-36">
      <div className="w-screen h-auto flex flex-col items-center justify-center mb-4 fixed top-0 left-0 z-50">
        <Header />
      </div>


      <main className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">

        {canManageHangars && isAddHangarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-3 sm:p-4">
            <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 sm:p-5 md:p-6 shadow-2xl">
              <h3 className={`mb-4 text-lg sm:text-xl md:text-2xl font-bold text-slate-900 ${roboto_condensed.className}`}>Nuevo hangar</h3>
              <form onSubmit={handleAddHangar} className="grid grid-cols-1 gap-3">
                <input
                  value={newHangar.label}
                  onChange={(event) => handleNewHangarChange("label", event.target.value)}
                  placeholder="Nombre del hangar"
                  className={`rounded-lg border border-slate-300 px-3 py-2 sm:py-3 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                />
                <input
                  value={newHangar.location}
                  onChange={(event) => handleNewHangarChange("location", event.target.value)}
                  placeholder="Ubicacion"
                  className={`rounded-lg border border-slate-300 px-3 py-2 sm:py-3 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                />
                <textarea
                  value={newHangar.description}
                  onChange={(event) => handleNewHangarChange("description", event.target.value)}
                  placeholder="Descripcion (opcional)"
                  rows={3}
                  className={`resize-none rounded-lg border border-slate-300 px-3 py-2 sm:py-3 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                />
                <select
                  value={newHangar.hangarType}
                  onChange={(event) => handleNewHangarChange("hangarType", event.target.value)}
                  className={`rounded-lg border border-slate-300 px-3 py-2 sm:py-3 text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                >
                  {HANGAR_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    className={`rounded-lg bg-cyan-600 px-4 py-2 sm:py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 ${roboto_condensed.className}`}
                  >
                    Guardar hangar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddHangarModalOpen(false)}
                    className={`rounded-lg bg-slate-200 px-4 py-2 sm:py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {canManageHangars && confirmDeleteHangarId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-4">
            <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-5 sm:p-6 md:p-8 shadow-2xl">
              <h3 className={`mb-3 text-xl sm:text-2xl md:text-3xl font-bold text-red-700 ${roboto_condensed.className}`}>
                Estas seguro de borrar este hangar?
              </h3>
              <p className={`mb-1 text-sm sm:text-base text-slate-700 ${roboto_condensed.className}`}>
                se borrara todo su contenido.
              </p>
              {hangarPendingDelete && (
                <p className={`mb-5 text-xs sm:text-sm text-slate-500 ${roboto_condensed.className}`}>
                  Hangar seleccionado: {hangarPendingDelete.label}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleConfirmDeleteHangar}
                  className={`rounded-lg bg-red-600 px-4 py-2 sm:py-3 text-sm font-semibold text-white transition hover:bg-red-700 ${roboto_condensed.className}`}
                >
                  Si, borrar hangar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteHangarId(null)}
                  className={`rounded-lg bg-slate-200 px-4 py-2 sm:py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {canManageHangars && hangars.map((hangar) => (
          <section key={hangar.id} className="flex flex-col justify-center items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-40 sm:h-52 md:h-64 w-full">
              <img
                src={hangar.image}
                alt={`Vista de ${hangar.label}`}
                fill
                sizes="(max-width: 640px) 100vw, 1200px"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/50 to-transparent">
              </div>
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 text-white gap-1 flex flex-col">
                <p className={`text-xs sm:text-base md:text-lg uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-200 ${roboto_condensed.className}`}>
                  {hangar.zoneTitle}
                </p>
                <h2 className={`text-lg sm:text-2xl md:text-3xl font-semibold ${roboto_condensed.className}`}>
                  {hangar.label}
                </h2>
                <p className={`text-xs sm:text-base md:text-lg text-slate-100 ${roboto_condensed.className}`}>
                  {hangar.location || "Sin ubicacion"}
                </p>

              </div>
              <div className="absolute bottom-1 sm:bottom-2 md:bottom-4 left-2 sm:left-4 text-white gap-1 flex flex-col">
                <p className={`text-xs sm:text-sm md:text-lg text-slate-100 ${roboto_condensed.className}`}>
                  {hangar.description}
                </p>
              </div>

              <div className="absolute right-2 sm:right-3 top-2 sm:top-3">
                <button
                  type="button"
                  onClick={() => handleToggleHangarMenu(hangar.id)}
                  aria-label="Abrir menu de acciones"
                  className={`relative h-9 sm:h-10 md:h-12 w-9 sm:w-10 md:w-12 rounded-full text-white flex items-center justify-center
                    transition hover:bg-white/30 ${roboto_condensed.className}`}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl leading-none" aria-hidden="true">
                    <IoMenu />
                  </span>
                </button>

                {hangarMenuOpenId === hangar.id && (
                  <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                    <Link
                      href={`/hangar/${hangar.id}`}
                      onClick={() => setHangarMenuOpenId(null)}
                      className={`block rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-black/10 ${roboto_condensed.className}`}
                    >
                      Ver hangar
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        handleStartEditHangar(hangar);
                        setHangarMenuOpenId(null);
                      }}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-black/10 ${roboto_condensed.className}`}
                    >
                      Editar hangar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestDeleteHangar(hangar.id)}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50 ${roboto_condensed.className}`}
                    >
                      Borrar hangar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {editingHangarId === hangar.id && (
              <div className="border-t border-slate-200 px-3 sm:px-4 py-3 sm:py-4 w-full">
                <form onSubmit={(event) => handleSaveHangar(event, hangar.id)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                  <input
                    value={hangarDraft.label}
                    onChange={(event) => handleHangarDraftChange("label", event.target.value)}
                    placeholder="Nombre del hangar"
                    className={`rounded-lg border border-slate-300 px-3 py-2 sm:py-3 text-xs sm:text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                  />
                  <input
                    value={hangarDraft.location}
                    onChange={(event) => handleHangarDraftChange("location", event.target.value)}
                    placeholder="Ubicacion"
                    className={`rounded-lg border border-slate-300 px-3 py-2 sm:py-3 text-xs sm:text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                  />
                  <textarea
                    value={hangarDraft.description}
                    onChange={(event) => handleHangarDraftChange("description", event.target.value)}
                    placeholder="Descripcion (opcional)"
                    rows={2}
                    className={`rounded-lg border border-slate-300 px-3 py-2 sm:py-3 text-xs sm:text-sm outline-none ring-cyan-300 focus:ring-2 sm:col-span-2 lg:col-span-1 ${roboto_condensed.className}`}
                  />
                  <select
                    value={hangarDraft.hangarType}
                    onChange={(event) => handleHangarDraftChange("hangarType", event.target.value)}
                    className={`rounded-lg border border-slate-300 px-3 py-2 sm:py-3 text-xs sm:text-sm outline-none ring-cyan-300 focus:ring-2 ${roboto_condensed.className}`}
                  >
                    {HANGAR_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className={`rounded-lg bg-emerald-600 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-emerald-700 ${roboto_condensed.className}`}
                  >
                    Guardar cambios
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelHangarEdit}
                    className={`rounded-lg bg-slate-200 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700 transition hover:bg-slate-300 ${roboto_condensed.className}`}
                  >
                    Cancelar
                  </button>
                </form>
              </div>
            )}


            <div className="flex flex-col lg:flex-col justify-center items-stretch w-full h-auto p-2 sm:p-4 gap-3 sm:gap-4">
              <div className="w-full lg:w-full flex flex-col justify-center items-center gap-2 sm:gap-3 p-2 sm:p-4 overflow-visible">
                <div className="flex flex-col lg:flex-row w-full lg:w-full gap-2 sm:gap-3">
                  {hangar.aircraftList?.slice(0, 4).map((aircraft) => (
                    <Link
                      key={`${hangar.id}-${aircraft.id}`}
                      href={`/hangar/${hangar.id}/aeronave/${encodeURIComponent(aircraft.id)}`}
                      className="w-full lg:flex-1 lg:min-w-0 rounded-lg border border-slate-200 bg-slate-50 py-1 sm:py-2 transition hover:border-cyan-300 hover:bg-cyan-50"
                    >
                      <div className="w-full h-auto flex justify-center lg:justify-around items-center gap-1 sm:gap-2 px-2">
                        <div className="flex items-center justify-center flex-shrink-0">
                          <FaPlane size={20} className="sm:w-6 sm:h-6 md:w-8 md:h-8" />

                        </div>
                        <div className="flex flex-col justify-center items-start whitespace-nowrap">
                          <p className={`text-xs sm:text-xs md:text-sm font-semibold uppercase text-slate-500 ${roboto_condensed.className}`}>
                            {aircraft.id}
                          </p>
                          <p className={`text-xs sm:text-xs md:text-sm font-medium text-slate-800 ${roboto_condensed.className}`}>
                            {aircraft.model}
                          </p>

                        </div>
                      </div>



                    </Link>
                  ))}
                </div>
              </div>

              <div className="w-full lg:w-full flex flex-col lg:flex-row justify-center items-stretch gap-2 sm:gap-3 md:gap-4">
                <Link
                  href={`/control_acceso_personal?hangar=${hangar.id}&tab=control_acceso_personal`}
                  className={`flex justify-center items-center flex-1 h-auto gap-2 rounded-xl  bg-white border border-gray-500 
                    px-3 sm:px-4 md:px-6 py-3 sm:py-4 shadow-md transition duration-500 hover:scale-[0.95] hover:shadow-gray-500/80
                    ${roboto_condensed.className}`}
                >
                  <RiAlarmWarningFill size={20} className="sm:w-6 sm:h-6 md:w-8 md:h-8 shrink-0 text-black" />

                  <p className={`text-xs sm:text-sm md:text-base text-center ${roboto_condensed.className}`}>
                    Entradas y salidas del hangar
                  </p>

                </Link>

                <Link
                  href={`/hangar/${hangar.id}`}
                  className={`flex justify-center items-center flex-1 h-auto gap-2 rounded-xl  bg-white border border-gray-500 
                    px-3 sm:px-4 md:px-6 py-3 sm:py-4 shadow-md transition duration-500 hover:scale-[0.95] hover:shadow-gray-500/80
                    ${roboto_condensed.className}`}
                >
                  <p className={`text-lg sm:text-xl md:text-2xl ${roboto_condensed.className}`}>
                    Entrar
                  </p>
                  <FaArrowRight size={20} className="sm:w-6 sm:h-6 md:w-8 md:h-8 shrink-0 text-black" />
                </Link>
              </div>

            </div>

          </section>
        ))}
      </main>

      {canManageHangars && (
        <button
          type="button"
          onClick={() => setIsAddHangarModalOpen(true)}
          aria-label="Agregar hangar"
          title="Agregar hangar"
          className={`group fixed bottom-4 sm:bottom-6 right-4 sm:right-15 z-40 flex h-14 sm:h-16 md:h-20 w-14 sm:w-16 md:w-20 items-center justify-center 
            rounded-full bg-blue-600 text-2xl sm:text-3xl font-bold text-white shadow-lg shadow-blue-500/40 
            transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 
            focus-visible:ring-blue-300 ${roboto_condensed.className}`}
        >
          <span aria-hidden="true">
            <FaPlus size={28} className="sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
          </span>
          <span className={`pointer-events-none absolute -translate-y-16 sm:-translate-y-20 whitespace-nowrap 
          rounded-md bg-blue-900 px-2 sm:px-3 py-1 text-xs sm:text-sm md:text-lg font-semibold text-white opacity-0 shadow transition 
          group-hover:opacity-100 ${roboto_condensed.className}`}>

            Agregar hangar

          </span>
        </button>
      )}
    </div>
  );
}