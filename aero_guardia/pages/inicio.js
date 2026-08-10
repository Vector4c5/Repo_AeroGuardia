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
import { FaPlus, FaPlaneLock, FaUserPlus } from "react-icons/fa6";
import { FaPlane, FaArrowRight, FaCopy } from "react-icons/fa";
import { RiAlarmWarningFill } from "react-icons/ri";
import { MdEmergency } from "react-icons/md";

const roboto_condensed = Roboto_Condensed({ weight: ["400", "700"], subsets: ["latin"] });
const jersey_10 = Montserrat({ weight: ["700", "800"], subsets: ["latin"] });

const emptyForm = {
  label: "",
  location: "",
  description: "",
  hangarType: HANGAR_TYPE_OPTIONS[0].value,
  baseAirport: "",
};

const ROLE_LABELS = { admin: "Administrador", engineer: "Ingeniero", technician: "Técnico" };
const hangarKey = (h) => String(h?.id || h?._id || "");
const inputCls = `rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring-2 sm:py-3 ${roboto_condensed.className}`;
const btnCyan = `rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-70 sm:py-3 ${roboto_condensed.className}`;
const btnGray = `rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 sm:py-3 ${roboto_condensed.className}`;
const btnRed = `rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-70 sm:py-3 ${roboto_condensed.className}`;
const cardLink = `flex h-auto flex-1 items-center justify-center gap-2 rounded-xl border bg-white px-3 py-3 shadow-md transition duration-500 hover:scale-[0.95] sm:px-4 sm:py-4 md:px-6 ${roboto_condensed.className}`;

async function readJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function Modal({ children, dark }) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${dark ? "bg-slate-900/70" : "bg-slate-900/55"}`}>
      {children}
    </div>
  );
}

export default function Inicio() {
  const { status } = useSession();
  const authed = status === "authenticated";

  const [hangars, setHangars] = useState([]);
  const [aircraftByHangar, setAircraftByHangar] = useState({});
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
  const [removeMember, setRemoveMember] = useState(null);
  const [revealingId, setRevealingId] = useState(null);
  const [membersOpenId, setMembersOpenId] = useState(null);

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

    (async () => {
      const entries = await Promise.all(
        hangars.map(async (hangar) => {
          const id = hangarKey(hangar);
          try {
            const res = await fetch(`/api/hangars/${id}/aircraft`);
            const data = await readJson(res);
            return [id, res.ok && Array.isArray(data.aircraftList) ? data.aircraftList : []];
          } catch {
            return [id, []];
          }
        })
      );
      if (!cancelled) setAircraftByHangar(Object.fromEntries(entries));
    })();

    return () => {
      cancelled = true;
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
    const open = addOpen || joinOpen || deleteId || leaveHangar || removeMember;
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [addOpen, joinOpen, deleteId, leaveHangar, removeMember]);

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

  const handleRemoveMember = async () => {
    if (!removeMember) return;
    setBusy(true);
    try {
      const data = await patchHangar(removeMember.hangarId, {
        action: "remove_member",
        memberUserId: removeMember.member.userId,
      });
      if (data.hangar) upsert(data.hangar);
      setRemoveMember(null);
      notifySuccess(data.message || "Miembro expulsado");
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
    <div className="flex min-h-screen w-full flex-col items-center bg-slate-100 px-3 py-8 pb-28 pt-24 text-slate-900 sm:px-4 sm:pt-28 md:px-6 md:pt-32 lg:px-8 lg:pt-36">
      <div className="fixed left-0 top-0 z-50 w-screen"><Header /></div>

      <main className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
        {addOpen && (
          <Modal>
            <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
              <h3 className={`mb-4 text-xl font-bold sm:text-2xl ${roboto_condensed.className}`}>Nuevo hangar</h3>
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
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
              <h3 className={`mb-2 text-xl font-bold ${roboto_condensed.className}`}>Unirse a un hangar</h3>
              <p className={`mb-4 text-sm text-slate-500 ${roboto_condensed.className}`}>Ingresa el código de invitación del propietario.</p>
              <form onSubmit={handleJoin} className="grid gap-3">
                <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="Código de invitación" required className={`${inputCls} font-mono uppercase ring-yellow-400`} />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="submit" disabled={busy} className={`rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-yellow-400 disabled:opacity-70 sm:py-3 ${roboto_condensed.className}`}>
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
              <h3 className={`mb-3 text-2xl font-bold text-red-700 ${roboto_condensed.className}`}>¿Borrar este hangar?</h3>
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

        {removeMember && (
          <Modal dark>
            <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-5 shadow-2xl sm:p-6">
              <h3 className={`mb-2 text-lg font-bold text-red-700 ${roboto_condensed.className}`}>Expulsar miembro</h3>
              <p className={`mb-5 text-sm text-slate-600 ${roboto_condensed.className}`}>
                ¿Expulsar a {removeMember.member.displayLabel || removeMember.member.name || "este usuario"}?
              </p>
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={handleRemoveMember} className={btnRed}>Expulsar</button>
                <button type="button" onClick={() => setRemoveMember(null)} className={btnGray}>Cancelar</button>
              </div>
            </div>
          </Modal>
        )}

        {leaveHangar && (
          <Modal dark>
            <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-5 shadow-2xl sm:p-6">
              <h3 className={`mb-2 text-lg font-bold text-amber-700 ${roboto_condensed.className}`}>Salir del hangar</h3>
              <p className={`mb-5 text-sm text-slate-600 ${roboto_condensed.className}`}>
                ¿Salir de &quot;{leaveHangar.label || leaveHangar.name}&quot;?
              </p>
              <div className="flex gap-2">
                <button type="button" disabled={busy} onClick={handleLeave} className={`rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-70 ${roboto_condensed.className}`}>
                  Salir
                </button>
                <button type="button" onClick={() => setLeaveHangar(null)} className={btnGray}>Cancelar</button>
              </div>
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

            return (
              <section key={id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="relative h-40 w-full sm:h-52 md:h-64">
                  <img src={image} alt={`Vista de ${label}`} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-900/50 to-transparent" />
                  <div className="absolute left-2 top-2 flex flex-col gap-1 text-white sm:left-4 sm:top-4">
                    <p className={`text-xs uppercase tracking-[0.15em] text-slate-200 sm:text-base md:text-lg ${roboto_condensed.className}`}>
                      {zoneTitle}
                      {!hangar.isOwner && (
                        <span className="ml-2 rounded bg-yellow-500/90 px-1.5 py-0.5 text-[10px] font-bold tracking-normal text-slate-900 sm:text-xs">
                          Miembro
                        </span>
                      )}
                    </p>
                    <h2 className={`text-lg font-semibold sm:text-2xl md:text-3xl ${roboto_condensed.className}`}>{label}</h2>
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
                      <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
                        <Link href={`/hangar/${id}`} onClick={() => setMenuId(null)} className={`block rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-black/10 ${roboto_condensed.className}`}>
                          Ver hangar
                        </Link>
                        {hangar.isOwner ? (
                          <>
                            <button type="button" onClick={() => startEdit(hangar)} className={`w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-black/10 ${roboto_condensed.className}`}>
                              Editar hangar
                            </button>
                            <button type="button" onClick={() => { setDeleteId(id); setMenuId(null); }} className={`w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50 ${roboto_condensed.className}`}>
                              Borrar hangar
                            </button>
                          </>
                        ) : (
                          <button type="button" onClick={() => { setLeaveHangar(hangar); setMenuId(null); }} className={`w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-amber-700 hover:bg-amber-50 ${roboto_condensed.className}`}>
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
                        <button type="submit" disabled={busy} className={`rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70 ${roboto_condensed.className}`}>
                          Guardar cambios
                        </button>
                        <button type="button" onClick={() => { setEditingId(null); setDraft(emptyForm); }} className={btnGray}>Cancelar</button>
                      </div>
                    </form>
                  </div>
                )}

                {hangar.isOwner && (
                  <div className="border-t border-slate-100 px-3 py-3 sm:px-4">
                    <div className="rounded-lg border border-cyan-100 bg-cyan-50/60 p-3">
                      <p className={`text-xs font-semibold uppercase tracking-wide text-cyan-800 ${roboto_condensed.className}`}>Código de invitación</p>
                      {hangar.inviteCodeVisible && hangar.inviteCode ? (
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <code className="font-mono text-sm font-bold text-slate-900">{hangar.inviteCode}</code>
                          <button type="button" onClick={() => { navigator.clipboard.writeText(hangar.inviteCode); notifySuccess("Código copiado"); }} className={`inline-flex items-center gap-1 text-sm font-medium text-cyan-700 hover:underline ${roboto_condensed.className}`}>
                            <FaCopy className="h-3 w-3" /> Copiar
                          </button>
                          {hangar.inviteCodeExpiresAt && (
                            <p className={`w-full text-xs text-slate-500 ${roboto_condensed.className}`}>
                              Visible hasta {formatInviteExpiry(hangar.inviteCodeExpiresAt)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2">
                          <p className={`text-xs text-slate-500 ${roboto_condensed.className}`}>Oculto por seguridad. Al mostrarlo estará disponible 24 horas.</p>
                          <button type="button" disabled={revealingId === id} onClick={() => handleReveal(id)} className={`mt-2 rounded-lg border border-cyan-200 bg-white px-3 py-1.5 text-sm font-semibold text-cyan-800 hover:bg-cyan-100 disabled:opacity-70 ${roboto_condensed.className}`}>
                            {revealingId === id ? "Mostrando..." : "Mostrar código"}
                          </button>
                        </div>
                      )}
                    </div>

                    <button type="button" onClick={() => setMembersOpenId((p) => (p === id ? null : id))} className={`mt-3 text-sm font-semibold text-slate-700 hover:text-cyan-700 ${roboto_condensed.className}`}>
                      Miembros ({hangar.members?.length || 0}) {membersOpenId === id ? "▴" : "▾"}
                    </button>
                    {membersOpenId === id && (
                      <div className="mt-2 space-y-2">
                        {(hangar.members || []).length === 0 ? (
                          <p className={`text-xs text-slate-500 ${roboto_condensed.className}`}>Sin miembros aún.</p>
                        ) : (
                          hangar.members.map((m) => (
                            <div key={m.userId} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                              <div className="min-w-0">
                                <p className={`truncate text-sm font-medium ${roboto_condensed.className}`}>{m.displayLabel || m.name || m.email}</p>
                                <p className={`text-xs text-slate-500 ${roboto_condensed.className}`}>{ROLE_LABELS[m.role] || m.role || "Miembro"}</p>
                              </div>
                              <button type="button" onClick={() => setRemoveMember({ hangarId: id, member: m })} className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 ${roboto_condensed.className}`}>
                                Expulsar
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3 p-2 sm:gap-4 sm:p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {aircraftList.slice(0, 4).map((ac) => {
                      const acId = ac._id || ac.id || ac.registration;
                      const pendingCount = Array.isArray(ac.maintenanceTasks)
                        ? ac.maintenanceTasks.filter((t) => t.status === "pending")
                            .length
                        : 0;
                      const isDeparted = ac.status === "Salida";

                      return (
                        <Link
                          key={`${id}-${acId}`}
                          href={`/hangar/${id}/aeronave/${encodeURIComponent(acId)}`}
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:w-[calc(50%-0.25rem)] lg:w-[calc(25%-0.4rem)] lg:flex-1 ${
                            isDeparted
                              ? "border-slate-200 bg-slate-100"
                              : pendingCount > 0
                                ? "border-amber-300 bg-amber-50 hover:border-amber-400"
                                : "border-cyan-200 bg-gradient-to-br from-white to-cyan-50 hover:border-cyan-400"
                          }`}
                        >
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${
                              isDeparted
                                ? "bg-slate-500"
                                : pendingCount > 0
                                  ? "bg-amber-500"
                                  : "bg-cyan-600"
                            }`}
                          >
                            <FaPlane className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-sm font-bold text-slate-900 sm:text-base ${roboto_condensed.className}`}
                            >
                              {ac.registration || "N/A"}
                            </p>
                            <p
                              className={`truncate text-xs text-slate-600 sm:text-sm ${roboto_condensed.className}`}
                            >
                              {ac.model || ac.manufacturer || "Sin modelo"}
                            </p>
                            <p
                              className={`mt-0.5 text-[10px] font-semibold sm:text-xs ${
                                isDeparted
                                  ? "text-slate-500"
                                  : pendingCount > 0
                                    ? "text-amber-700"
                                    : "text-cyan-700"
                              } ${roboto_condensed.className}`}
                            >
                              {isDeparted
                                ? "Salida"
                                : pendingCount > 0
                                  ? `${pendingCount} pendiente${pendingCount === 1 ? "" : "s"}`
                                  : ac.status || "En hangar"}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                    {aircraftList.length === 0 && (
                      <p
                        className={`w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 py-4 text-center text-xs text-slate-400 sm:text-sm ${roboto_condensed.className}`}
                      >
                        Sin aeronaves registradas
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 lg:flex-row sm:gap-3">
                    <Link href={`/control_acceso_personal?hangar=${id}&tab=control_acceso_personal`} className={`${cardLink} border-gray-500 hover:shadow-gray-500/80`}>
                      <RiAlarmWarningFill className="h-5 w-5 shrink-0 sm:h-6 sm:w-6 md:h-8 md:w-8" />
                      <p className="text-center text-xs sm:text-sm md:text-base">Entradas y salidas del hangar</p>
                    </Link>
                    <Link href="/emergencia" className={`${cardLink} border-red-400 hover:shadow-red-400/50`}>
                      <MdEmergency className="h-5 w-5 shrink-0 text-red-600 sm:h-6 sm:w-6 md:h-8 md:w-8" />
                      <p className="text-center text-xs text-red-700 sm:text-sm md:text-base">Emergencia</p>
                    </Link>
                    <Link href={`/hangar/${id}`} className={`${cardLink} border-gray-500 hover:shadow-gray-500/80`}>
                      <p className="text-lg sm:text-xl md:text-2xl">Entrar</p>
                      <FaArrowRight className="h-5 w-5 shrink-0 sm:h-6 sm:w-6 md:h-8 md:w-8" />
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
          className={`group relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/40 transition hover:bg-blue-800 focus-visible:ring-4 focus-visible:ring-blue-300 sm:h-16 sm:w-16 lg:h-[4.5rem] lg:w-[4.5rem] ${roboto_condensed.className}`}
        >
          <FaPlus className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow transition group-hover:opacity-100 sm:text-sm">
            Agregar hangar
          </span>
        </button>

        <button
          type="button"
          onClick={() => setJoinOpen(true)}
          aria-label="Unirse a hangar"
          title="Unirse a hangar"
          className={`group relative flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500 text-slate-900 shadow-lg shadow-yellow-500/40 transition hover:bg-yellow-400 focus-visible:ring-4 focus-visible:ring-yellow-300 sm:h-16 sm:w-16 lg:h-[4.5rem] lg:w-[4.5rem] ${roboto_condensed.className}`}
        >
          <FaUserPlus className="h-6 w-6 sm:h-7 sm:w-7" />
          <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md bg-yellow-700 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow transition group-hover:opacity-100 sm:text-sm">
            Unirse a hangar
          </span>
        </button>
      </div>
    </div>
  );
}
