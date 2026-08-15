import Link from "next/link";
import { useSession } from "next-auth/react";
import { Roboto_Condensed } from "next/font/google";
import { Montserrat } from "next/font/google";
import { useCallback, useEffect, useState } from "react";
import Header from "@/Components/common/Header";
import { HANGAR_TYPE_OPTIONS, getHangarTypeConfig } from "@/lib/hangarTypes";
import { formatInviteExpiry } from "@/lib/hangarInvite";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { IoMenu } from "react-icons/io5";
import { FaPlus, FaPlaneLock, FaUserPlus, FaRightToBracket } from "react-icons/fa6";
import { FaArrowRight, FaCopy, FaClipboardList, FaPlane } from "react-icons/fa";
import { RiAlarmWarningFill } from "react-icons/ri";

const roboto_condensed = Roboto_Condensed({ weight: ["400", "700"], subsets: ["latin"] });
const jersey_10 = Montserrat({ weight: ["700", "800"], subsets: ["latin"] });

const emptyForm = {
  label: "",
  location: "",
  description: "",
  hangarType: HANGAR_TYPE_OPTIONS[0].value,
  baseAirport: "",
};

const hangarKey = (h) => String(h?.id || h?._id || "");

const isToday = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const inputCls = `rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-royal/30 focus:ring-2 sm:py-3 ${roboto_condensed.className}`;
const btnCyan = `rounded-xl bg-gradient-to-r from-navy to-royal px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-70 sm:py-3 ${roboto_condensed.className}`;
const btnGray = `rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 sm:py-3 ${roboto_condensed.className}`;
const btnRed = `rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-70 sm:py-3 ${roboto_condensed.className}`;
const btnGold = `rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-navy shadow-sm transition hover:brightness-105 disabled:opacity-70 sm:py-3 ${roboto_condensed.className}`;

async function readJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function Modal({ children, dark }) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${dark ? "bg-navy/70" : "bg-navy/40"}`}>
      {children}
    </div>
  );
}

const STAT_ACCENTS = {
  royal: "bg-royal shadow-royal/20",
  sky: "bg-sky shadow-sky/20",
  gold: "bg-gold shadow-gold/20",
};

function Kicker({ children }) {
  return (
    <p className={`text-xs font-bold uppercase tracking-[0.2em] text-royal ${roboto_condensed.className}`}>
      {children}
    </p>
  );
}

function StatCard({ icon, label, value, accent = "royal", tone = "default", href }) {
  const toneCls = tone === "warning" ? "border-gold/50 bg-gold/10" : "border-slate-200 bg-white";
  const content = (
    <>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base text-white shadow-md sm:h-12 sm:w-12 sm:text-xl ${STAT_ACCENTS[accent]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-xl font-bold leading-none text-navy sm:text-3xl ${jersey_10.className}`}>{value}</p>
        <p className={`mt-1 truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-sm ${roboto_condensed.className}`}>{label}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`flex items-center gap-2 rounded-2xl border p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-royal/40 hover:shadow-md sm:gap-3 sm:p-4 ${toneCls}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={`flex items-center gap-2 rounded-2xl border p-2 shadow-sm sm:gap-3 sm:p-4 ${toneCls}`}>
      {content}
    </div>
  );
}

export default function Inicio() {
  const { status } = useSession();
  const authed = status === "authenticated";

  const [hangars, setHangars] = useState([]);
  const [aircraftByHangar, setAircraftByHangar] = useState({});
  const [accessEventsByHangar, setAccessEventsByHangar] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [newHangar, setNewHangar] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyForm);
  const [menuId, setMenuId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [leaveHangar, setLeaveHangar] = useState(null);
  const [revealingId, setRevealingId] = useState(null);
  const [inviteModalId, setInviteModalId] = useState(null);

  const loadHangars = useCallback(async ({ showLoading = true } = {}) => {
    if (!authed) return;
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch("/api/hangars");
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Error al cargar hangares");
      setHangars(Array.isArray(data.hangars) ? data.hangars : []);
    } catch (err) {
      notifyError(err.message);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [authed]);

  useEffect(() => {
    loadHangars();
  }, [loadHangars]);

  useEffect(() => {
    if (!authed || hangars.length === 0) return;
    let cancelled = false;

    const cargarActividad = async () => {
      const entries = await Promise.all(
        hangars.map(async (hangar) => {
          const id = hangarKey(hangar);
          const [aircraftData, accesoData] = await Promise.all([
            fetch(`/api/hangars/${id}/aircraft`).then(readJson).catch(() => ({})),
            fetch(`/api/acceso?hangarId=${id}`).then(readJson).catch(() => ({})),
          ]);
          return [
            id,
            Array.isArray(aircraftData.aircraftList) ? aircraftData.aircraftList : [],
            Array.isArray(accesoData.eventos) ? accesoData.eventos : [],
          ];
        })
      );
      if (!cancelled) {
        setAircraftByHangar(Object.fromEntries(entries.map(([id, aircraftList]) => [id, aircraftList])));
        setAccessEventsByHangar(Object.fromEntries(entries.map(([id, , accessEvents]) => [id, accessEvents])));
      }
    };

    cargarActividad();
    const intervalo = setInterval(cargarActividad, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalo);
    };
  }, [hangars, authed]);

  useEffect(() => {
    const visible = hangars.filter((h) => h.isOwner && h.inviteCodeVisible && h.inviteCodeExpiresAt);
    if (!visible.length) return;
    const delay = Math.min(...visible.map((h) => new Date(h.inviteCodeExpiresAt).getTime())) - Date.now();
    if (delay <= 0) {
      loadHangars({ showLoading: false });
      return;
    }
    const t = setTimeout(() => {
      loadHangars({ showLoading: false });
      notifySuccess("El código de invitación expiró y se generó uno nuevo");
    }, delay);
    return () => clearTimeout(t);
  }, [hangars, loadHangars]);

  useEffect(() => {
    const open = addOpen || joinOpen || deleteId || leaveHangar || inviteModalId;
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [addOpen, joinOpen, deleteId, leaveHangar, inviteModalId]);

  const upsert = (updated) => {
    const key = hangarKey(updated);
    setHangars((cur) => cur.map((h) => (hangarKey(h) === key ? updated : h)));
  };

  const patchHangar = async (id, body) => {
    const res = await fetch(`/api/hangars/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.error || "Error en la operación");
    return data;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const label = newHangar.label.trim();
    const location = newHangar.location.trim();
    if (!label || !location) {
      notifyError("Nombre y ubicación son obligatorios");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/hangars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          location,
          description: newHangar.description.trim(),
          hangarType: newHangar.hangarType,
          baseAirport: newHangar.baseAirport.trim() || undefined,
        }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Error al crear hangar");
      const created = data.hangar || data;
      setHangars((cur) => [created, ...cur]);
      setNewHangar(emptyForm);
      setAddOpen(false);
      notifySuccess(`Hangar "${created.label || created.name}" creado`);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      notifyError("Ingresa un código de invitación");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/hangars/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Error al unirse al hangar");
      setHangars((cur) => [...cur, data]);
      setInviteCode("");
      setJoinOpen(false);
      notifySuccess(data.message || `Te uniste a "${data.label || data.name}"`);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleReveal = async (id) => {
    setRevealingId(id);
    try {
      const data = await patchHangar(id, { action: "reveal_invite_code" });
      if (data.hangar) upsert(data.hangar);
      notifySuccess(data.message || "Código visible por 24 horas");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setRevealingId(null);
    }
  };

  const startEdit = (hangar) => {
    setEditingId(hangarKey(hangar));
    setDraft({
      label: hangar.label || hangar.name || "",
      location: hangar.location || "",
      description: hangar.description || "",
      hangarType: hangar.hangarType || HANGAR_TYPE_OPTIONS[0].value,
      baseAirport: hangar.baseAirport || "",
    });
    setMenuId(null);
  };

  const handleSave = async (e, id) => {
    e.preventDefault();
    const label = draft.label.trim();
    const location = draft.location.trim();
    if (!label || !location) {
      notifyError("Nombre y ubicación son obligatorios");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/hangars/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          location,
          description: draft.description.trim(),
          hangarType: draft.hangarType,
          baseAirport: draft.baseAirport.trim() || undefined,
        }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Error al actualizar hangar");
      if (data.hangar) upsert(data.hangar);
      setEditingId(null);
      setDraft(emptyForm);
      notifySuccess("Hangar actualizado");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/hangars/${deleteId}`, { method: "DELETE" });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Error al borrar hangar");
      setHangars((cur) => cur.filter((h) => hangarKey(h) !== String(deleteId)));
      setDeleteId(null);
      setEditingId(null);
      notifySuccess(data.message || "Hangar eliminado");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!leaveHangar) return;
    const id = hangarKey(leaveHangar);
    setBusy(true);
    try {
      const data = await patchHangar(id, { action: "leave_hangar" });
      setHangars((cur) => cur.filter((h) => hangarKey(h) !== id));
      setLeaveHangar(null);
      notifySuccess(data.message || "Saliste del hangar");
    } catch (err) {
      notifyError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const pendingDelete = hangars.find((h) => hangarKey(h) === String(deleteId));
  const inviteModalHangar = hangars.find((h) => hangarKey(h) === String(inviteModalId));

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className={roboto_condensed.className}>Cargando sesión...</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen w-full bg-white text-slate-900">
        <div className="fixed left-0 top-0 z-50 w-screen"><Header /></div>
        <main className="mx-auto flex min-h-screen w-full items-center justify-center px-3 sm:px-6">
          <section className="flex h-auto w-11/12 flex-col items-stretch gap-4 overflow-hidden rounded-2xl border border-slate-200 p-4 shadow-2xl sm:w-10/12 sm:gap-6 sm:rounded-3xl sm:p-6 md:w-9/12 lg:w-8/12 lg:flex-row xl:w-7/12">
            <div className="flex h-32 w-full items-center justify-center sm:h-40 lg:h-full lg:w-1/2">
              <FaPlaneLock size={120} className="text-black sm:h-32 sm:w-32 lg:h-96 lg:w-96" />
            </div>
            <div className="flex w-full flex-col items-center justify-center gap-3 lg:w-1/2 lg:items-start">
              <h1 className={`text-center text-3xl text-black sm:text-4xl md:text-5xl lg:text-left ${jersey_10.className}`}>
                AeroGuardia
              </h1>
              <p className={`mb-3 text-center text-sm sm:text-base md:text-lg lg:text-left ${roboto_condensed.className}`}>
                Gestiona tus hangares, controla accesos y mantén toda la información de tus aeronaves en un solo lugar.
                Inicia sesión para acceder a tu panel.
              </p>
              <Link
                href="/"
                className={`inline-flex rounded-lg bg-blue-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-blue-800 ${roboto_condensed.className}`}
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
    <div className="flex min-h-screen w-full flex-col items-center bg-mist px-3 py-8 pb-28 pt-24 text-slate-900 sm:px-4 sm:pt-28 md:px-6 md:pt-32 lg:px-8 lg:pt-36">
      <div className="fixed left-0 top-0 z-50 w-screen"><Header /></div>

      <main className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
        {addOpen && (
          <Modal>
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
              <h3 className={`mb-4 text-xl text-navy sm:text-2xl ${jersey_10.className}`}>Nuevo hangar</h3>
              <form onSubmit={handleAdd} className="grid gap-3">
                <input value={newHangar.label} onChange={(e) => setNewHangar((p) => ({ ...p, label: e.target.value }))} placeholder="Nombre del hangar" required className={inputCls} />
                <input value={newHangar.location} onChange={(e) => setNewHangar((p) => ({ ...p, location: e.target.value }))} placeholder="Ubicacion" required className={inputCls} />
                <input value={newHangar.baseAirport} onChange={(e) => setNewHangar((p) => ({ ...p, baseAirport: e.target.value.toUpperCase().slice(0, 4) }))} placeholder="Aeropuerto base ICAO (opcional)" maxLength={4} className={`${inputCls} uppercase`} />
                <textarea value={newHangar.description} onChange={(e) => setNewHangar((p) => ({ ...p, description: e.target.value }))} placeholder="Descripcion (opcional)" rows={3} className={`resize-none ${inputCls}`} />
                <select value={newHangar.hangarType} onChange={(e) => setNewHangar((p) => ({ ...p, hangarType: e.target.value }))} className={inputCls}>
                  {HANGAR_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="submit" disabled={busy} className={btnCyan}>{busy ? "Guardando..." : "Guardar hangar"}</button>
                  <button type="button" onClick={() => setAddOpen(false)} className={btnGray}>Cancelar</button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {joinOpen && (
          <Modal>
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
              <h3 className={`mb-2 text-xl text-navy ${jersey_10.className}`}>Unirse a un hangar</h3>
              <p className={`mb-4 text-sm text-slate-500 ${roboto_condensed.className}`}>Ingresa el código de invitación del propietario.</p>
              <form onSubmit={handleJoin} className="grid gap-3">
                <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="Código de invitación" required className={`${inputCls} font-mono uppercase ring-gold/50`} />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="submit" disabled={busy} className={btnGold}>
                    {busy ? "Uniéndose..." : "Unirse"}
                  </button>
                  <button type="button" onClick={() => setJoinOpen(false)} className={btnGray}>Cancelar</button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {deleteId && (
          <Modal dark>
            <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-white p-5 shadow-2xl sm:p-8">
              <h3 className={`mb-3 text-2xl text-red-700 ${jersey_10.className}`}>¿Borrar este hangar?</h3>
              <p className={`mb-1 text-sm text-slate-700 ${roboto_condensed.className}`}>Se borrará todo su contenido.</p>
              {pendingDelete && (
                <p className={`mb-5 text-sm text-slate-500 ${roboto_condensed.className}`}>
                  Hangar: {pendingDelete.label || pendingDelete.name}
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" disabled={busy} onClick={handleDelete} className={btnRed}>{busy ? "Borrando..." : "Si, borrar hangar"}</button>
                <button type="button" onClick={() => setDeleteId(null)} className={btnGray}>Cancelar</button>
              </div>
            </div>
          </Modal>
        )}

        {leaveHangar && (
          <Modal dark>
            <div className="w-full max-w-md rounded-2xl border border-gold/40 bg-white p-5 shadow-2xl sm:p-6">
              <h3 className={`mb-2 text-lg text-amber-700 ${jersey_10.className}`}>Salir del hangar</h3>
              <p className={`mb-5 text-sm text-slate-600 ${roboto_condensed.className}`}>
                ¿Salir de &quot;{leaveHangar.label || leaveHangar.name}&quot;?
              </p>
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={handleLeave} className={btnGold}>
                  Salir
                </button>
                <button type="button" onClick={() => setLeaveHangar(null)} className={btnGray}>Cancelar</button>
              </div>
            </div>
          </Modal>
        )}

        {inviteModalHangar && (
          <Modal dark>
            <div className="w-full max-w-md rounded-2xl border border-royal/15 bg-white p-6 text-center shadow-2xl">
              <p className={`text-xs font-semibold uppercase tracking-wide text-royal ${roboto_condensed.className}`}>
                Código de invitación
              </p>
              <h3 className={`mt-1 text-lg text-navy ${jersey_10.className}`}>
                {inviteModalHangar.label || inviteModalHangar.name}
              </h3>

              {inviteModalHangar.inviteCodeVisible && inviteModalHangar.inviteCode ? (
                <>
                  <p className={`mt-6 select-all break-all text-4xl tracking-[0.3em] text-navy ${jersey_10.className}`}>
                    {inviteModalHangar.inviteCode}
                  </p>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(inviteModalHangar.inviteCode); notifySuccess("Código copiado"); }}
                    className={`mt-4 inline-flex items-center gap-2 rounded-xl border border-royal/20 bg-mist px-4 py-2 text-sm font-semibold text-royal hover:bg-royal/10 ${roboto_condensed.className}`}
                  >
                    <FaCopy className="h-3 w-3" /> Copiar código
                  </button>
                  {inviteModalHangar.inviteCodeExpiresAt && (
                    <p className={`mt-3 text-xs text-slate-500 ${roboto_condensed.className}`}>
                      Visible hasta {formatInviteExpiry(inviteModalHangar.inviteCodeExpiresAt)}
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-6">
                  <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
                    Oculto por seguridad. Al mostrarlo estará disponible 24 horas.
                  </p>
                  <button
                    type="button"
                    disabled={revealingId === inviteModalId}
                    onClick={() => handleReveal(inviteModalId)}
                    className={`mt-4 rounded-xl border border-royal/20 bg-mist px-4 py-2 text-sm font-semibold text-royal hover:bg-royal/10 disabled:opacity-70 ${roboto_condensed.className}`}
                  >
                    {revealingId === inviteModalId ? "Mostrando..." : "Mostrar código"}
                  </button>
                </div>
              )}

              <button type="button" onClick={() => setInviteModalId(null)} className={`mt-6 w-full ${btnGray}`}>
                Cerrar
              </button>
            </div>
          </Modal>
        )}

        {isLoading ? (
          <div className={`rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 ${roboto_condensed.className}`}>
            Cargando hangares...
          </div>
        ) : hangars.length === 0 ? (
          <div className={`rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 ${roboto_condensed.className}`}>
            Aún no tienes hangares. Crea uno o únete con un código de invitación.
          </div>
        ) : (
          hangars.map((hangar) => {
            const id = hangarKey(hangar);
            const type = getHangarTypeConfig(hangar.hangarType);
            const image = hangar.image || type.image;
            const zoneTitle = hangar.zoneTitle || type.label;
            const label = hangar.label || hangar.name || "Hangar";
            const aircraftList = aircraftByHangar[id] || [];
            const accessEvents = accessEventsByHangar[id] || [];
            const inHangarCount = aircraftList.filter((ac) => ac.status !== "Salida").length;
            const pendingTasksCount = aircraftList.reduce((sum, ac) => {
              const tasks = Array.isArray(ac.maintenanceTasks) ? ac.maintenanceTasks : [];
              return sum + tasks.filter((t) => t.status === "pending").length;
            }, 0);
            const entriesToday = accessEvents.filter(
              (e) => e.tipo === "ENTRADA" && e.estado === "AUTORIZADO" && isToday(e.createdAt)
            ).length;
            const attentionAircraft = aircraftList
              .map((ac) => {
                const tasks = Array.isArray(ac.maintenanceTasks) ? ac.maintenanceTasks : [];
                const pending = tasks.filter((t) => t.status === "pending").length;
                return { ac, pending };
              })
              .filter((item) => item.pending > 0)
              .slice(0, 3);
            const recentEvents = accessEvents.slice(0, 4);

            return (
              <section key={id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md shadow-navy/5">
                <div className="relative h-40 w-full sm:h-52 md:h-64">
                  <img src={image} alt={`Vista de ${label}`} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-linear-to-t from-navy/85 via-navy/15 to-transparent" />
                  <div className="absolute left-2 top-2 flex flex-col gap-1 text-white sm:left-4 sm:top-4">
                    <p className={`text-xs uppercase tracking-[0.15em] text-slate-200 sm:text-base md:text-lg ${roboto_condensed.className}`}>
                      {zoneTitle}
                      {!hangar.isOwner && (
                        <span className="ml-2 rounded bg-gold/90 px-1.5 py-0.5 text-[10px] font-bold tracking-normal text-navy sm:text-xs">
                          Miembro
                        </span>
                      )}
                    </p>
                    <h2 className={`text-lg sm:text-2xl md:text-3xl ${jersey_10.className}`}>{label}</h2>
                    <p className={`text-xs text-slate-100 sm:text-base md:text-lg ${roboto_condensed.className}`}>
                      {hangar.location || "Sin ubicacion"}
                      {hangar.baseAirport ? ` · ${hangar.baseAirport}` : ""}
                    </p>
                  </div>
                  <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4">
                    <p className={`text-xs text-slate-100 sm:text-sm md:text-lg ${roboto_condensed.className}`}>{hangar.description}</p>
                  </div>
                  <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
                    <button type="button" onClick={() => setMenuId((p) => (p === id ? null : id))} aria-label="Menu" className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/30 sm:h-12 sm:w-12">
                      <IoMenu className="text-2xl sm:text-3xl" />
                    </button>
                    {menuId === id && (
                      <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                        <Link href={`/hangar/${id}`} onClick={() => setMenuId(null)} className={`block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-mist ${roboto_condensed.className}`}>
                          Ver hangar
                        </Link>
                        {hangar.isOwner && (
                          <button type="button" onClick={() => { setInviteModalId(id); setMenuId(null); }} className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-mist ${roboto_condensed.className}`}>
                            Mostrar código
                          </button>
                        )}
                        {hangar.isOwner ? (
                          <>
                            <button type="button" onClick={() => startEdit(hangar)} className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-mist ${roboto_condensed.className}`}>
                              Editar hangar
                            </button>
                            <button type="button" onClick={() => { setDeleteId(id); setMenuId(null); }} className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50 ${roboto_condensed.className}`}>
                              Borrar hangar
                            </button>
                          </>
                        ) : (
                          <button type="button" onClick={() => { setLeaveHangar(hangar); setMenuId(null); }} className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-amber-700 hover:bg-amber-50 ${roboto_condensed.className}`}>
                            Salir del hangar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {editingId === id && hangar.isOwner && (
                  <div className="border-t border-slate-200 px-3 py-3 sm:px-4 sm:py-4">
                    <form onSubmit={(e) => handleSave(e, id)} className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <input value={draft.label} onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))} placeholder="Nombre" className={inputCls} />
                      <input value={draft.location} onChange={(e) => setDraft((p) => ({ ...p, location: e.target.value }))} placeholder="Ubicacion" className={inputCls} />
                      <textarea value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} placeholder="Descripcion" rows={2} className={inputCls} />
                      <select value={draft.hangarType} onChange={(e) => setDraft((p) => ({ ...p, hangarType: e.target.value }))} className={inputCls}>
                        {HANGAR_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
                        <button type="submit" disabled={busy} className={btnCyan}>
                          Guardar cambios
                        </button>
                        <button type="button" onClick={() => { setEditingId(null); setDraft(emptyForm); }} className={btnGray}>Cancelar</button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="flex flex-col gap-4 p-2 sm:gap-5 sm:p-4">
                  <div className="space-y-2">
                    <Kicker>Resumen</Kicker>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <StatCard icon={<FaPlaneLock />} label="En hangar" value={inHangarCount} accent="royal" href={`/hangar/${id}`} />
                      <StatCard
                        icon={<FaClipboardList />}
                        label="Pendientes"
                        value={pendingTasksCount}
                        accent="gold"
                        tone={pendingTasksCount > 0 ? "warning" : "default"}
                        href={`/pending?hangar=${id}`}
                      />
                      <StatCard icon={<FaRightToBracket />} label="Ingresos" value={entriesToday} accent="sky" href={`/control_acceso_personal?hangar=${id}`} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                      <Kicker>Atención requerida</Kicker>
                      {attentionAircraft.length === 0 ? (
                        <p className={`mt-3 text-sm text-slate-500 ${roboto_condensed.className}`}>
                          Todo al día — sin tareas pendientes.
                        </p>
                      ) : (
                        <ul className="mt-3 space-y-2">
                          {attentionAircraft.map(({ ac, pending }) => {
                            const acId = ac._id || ac.id || ac.registration;
                            return (
                              <li key={acId}>
                                <Link
                                  href={`/hangar/${id}/aeronave/${encodeURIComponent(acId)}`}
                                  className="flex items-center gap-3 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 transition hover:bg-gold/10"
                                >
                                  <FaPlane className="h-4 w-4 shrink-0 text-gold" />
                                  <span className={`min-w-0 flex-1 truncate text-sm font-semibold text-navy ${roboto_condensed.className}`}>
                                    {ac.registration || "N/A"}
                                  </span>
                                  <span className={`shrink-0 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-navy ${roboto_condensed.className}`}>
                                    {pending}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {pendingTasksCount > attentionAircraft.reduce((s, i) => s + i.pending, 0) && (
                        <Link href={`/hangar/${id}`} className={`mt-2 inline-block text-xs font-semibold text-royal hover:underline ${roboto_condensed.className}`}>
                          Ver todas las pendientes
                        </Link>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                      <Kicker>Actividad reciente</Kicker>
                      {recentEvents.length === 0 ? (
                        <p className={`mt-3 text-sm text-slate-500 ${roboto_condensed.className}`}>
                          Sin actividad registrada todavía.
                        </p>
                      ) : (
                        <ul className="mt-3 space-y-2">
                          {recentEvents.map((e) => (
                            <li key={e._id} className="flex items-center gap-3 px-1 py-1">
                              <span className={`h-2 w-2 shrink-0 rounded-full ${e.estado === "DENEGADO" ? "bg-red-500" : "bg-sky"}`} />
                              <span className={`min-w-0 flex-1 truncate text-sm text-slate-700 ${roboto_condensed.className}`}>
                                {e.nombre || "Desconocido"}
                              </span>
                              <span className={`shrink-0 text-xs font-semibold uppercase ${e.estado === "DENEGADO" ? "text-red-600" : "text-sky"} ${roboto_condensed.className}`}>
                                {e.estado === "DENEGADO" ? "Denegado" : "Autorizado"}
                              </span>
                              <span className={`hidden shrink-0 text-xs text-slate-400 sm:inline ${roboto_condensed.className}`}>
                                {e.hora}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <Link
                      href={`/control_acceso_personal?hangar=${id}&tab=control_acceso_personal`}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-navy/15 bg-white px-4 py-3 text-navy shadow-sm transition hover:border-royal hover:bg-mist sm:py-4 ${roboto_condensed.className}`}
                    >
                      <RiAlarmWarningFill className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
                      <p className="text-center text-xs font-semibold uppercase tracking-wide sm:text-sm">Entradas y salidas del hangar</p>
                    </Link>
                    <Link
                      href={`/hangar/${id}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-navy to-royal px-4 py-3 text-white shadow-md shadow-navy/20 transition hover:brightness-110 sm:py-4"
                    >
                      <p className={`text-lg tracking-wide sm:text-xl ${jersey_10.className}`}>Entrar</p>
                      <FaArrowRight className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" />
                    </Link>
                  </div>
                </div>
              </section>
            );
          })
        )}
      </main>

      <div className="fixed bottom-5 right-5 z-40 flex flex-col-reverse items-end gap-3 sm:bottom-6 sm:right-6 sm:gap-4">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          aria-label="Agregar hangar"
          title="Agregar hangar"
          className={`group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-navy to-royal text-white shadow-lg shadow-royal/40 transition hover:brightness-110 focus-visible:ring-4 focus-visible:ring-royal/30 sm:h-16 sm:w-16 lg:h-[4.5rem] lg:w-[4.5rem] ${roboto_condensed.className}`}
        >
          <FaPlus className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow transition group-hover:opacity-100 sm:text-sm">
            Agregar hangar
          </span>
        </button>

        <button
          type="button"
          onClick={() => setJoinOpen(true)}
          aria-label="Unirse a hangar"
          title="Unirse a hangar"
          className={`group relative flex h-14 w-14 items-center justify-center rounded-full bg-gold text-navy shadow-lg shadow-gold/40 transition hover:brightness-105 focus-visible:ring-4 focus-visible:ring-gold/40 sm:h-16 sm:w-16 lg:h-[4.5rem] lg:w-[4.5rem] ${roboto_condensed.className}`}
        >
          <FaUserPlus className="h-6 w-6 sm:h-7 sm:w-7" />
          <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow transition group-hover:opacity-100 sm:text-sm">
            Unirse a hangar
          </span>
        </button>
      </div>
    </div>
  );
}
