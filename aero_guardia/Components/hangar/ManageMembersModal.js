import { useState } from "react";
import { Roboto_Condensed } from "next/font/google";
import { FiX } from "react-icons/fi";
import { ROLE_LABELS } from "@/lib/hangarRoles";

const roboto_condensed = Roboto_Condensed({ weight: ["400", "700"], subsets: ["latin"] });

const selectCls = `rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 outline-none ring-cyan-300 focus:ring-2 disabled:opacity-60 ${roboto_condensed.className}`;
const btnCyan = `rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-70 ${roboto_condensed.className}`;
const btnGray = `rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 disabled:opacity-70 ${roboto_condensed.className}`;
const btnRed = `rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-70 ${roboto_condensed.className}`;

function ConfirmOverlay({ children }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">{children}</div>
    </div>
  );
}

export default function ManageMembersModal({ hangar, isOpen, busy, onClose, onChangeRole, onRemoveMember }) {
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [pendingRemove, setPendingRemove] = useState(null);

  if (!isOpen || !hangar) return null;

  const members = hangar.members || [];

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;
    await onChangeRole(pendingRoleChange.member.userId, pendingRoleChange.role);
    setPendingRoleChange(null);
  };

  const confirmRemove = async () => {
    if (!pendingRemove) return;
    await onRemoveMember(pendingRemove);
    setPendingRemove(null);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/55 p-3 sm:p-4">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
          <h3 className={`text-lg font-bold text-slate-900 ${roboto_condensed.className}`}>
            Administrar miembros
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {members.length === 0 ? (
            <p className={`text-sm text-slate-500 ${roboto_condensed.className}`}>
              Nadie más se ha unido todavía. Comparte el código de invitación desde /inicio.
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const label = member.displayLabel || member.name || member.email;

                return (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <p className={`min-w-0 flex-1 truncate text-sm font-medium text-slate-800 ${roboto_condensed.className}`}>
                      {label}
                    </p>
                    <select
                      value={member.role || "technician"}
                      disabled={busy}
                      onChange={(e) => {
                        const role = e.target.value;
                        if (role === member.role) return;
                        setPendingRoleChange({ member, role });
                      }}
                      className={selectCls}
                    >
                      {Object.entries(ROLE_LABELS).map(([value, roleLabel]) => (
                        <option key={value} value={value}>{roleLabel}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setPendingRemove(member)}
                      className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 ${roboto_condensed.className}`}
                    >
                      Expulsar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {pendingRoleChange && (
        <ConfirmOverlay>
          <p className={`text-slate-800 ${roboto_condensed.className}`}>
            ¿Cambiar el rol de{" "}
            <strong>
              {pendingRoleChange.member.displayLabel || pendingRoleChange.member.name || pendingRoleChange.member.email}
            </strong>{" "}
            a <strong>{ROLE_LABELS[pendingRoleChange.role]}</strong>?
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" disabled={busy} onClick={() => setPendingRoleChange(null)} className={btnGray}>
              Cancelar
            </button>
            <button type="button" disabled={busy} onClick={confirmRoleChange} className={btnCyan}>
              Confirmar
            </button>
          </div>
        </ConfirmOverlay>
      )}

      {pendingRemove && (
        <ConfirmOverlay>
          <p className={`text-slate-800 ${roboto_condensed.className}`}>
            ¿Expulsar a <strong>{pendingRemove.displayLabel || pendingRemove.name || "este usuario"}</strong> del hangar?
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" disabled={busy} onClick={() => setPendingRemove(null)} className={btnGray}>
              Cancelar
            </button>
            <button type="button" disabled={busy} onClick={confirmRemove} className={btnRed}>
              Expulsar
            </button>
          </div>
        </ConfirmOverlay>
      )}
    </div>
  );
}
