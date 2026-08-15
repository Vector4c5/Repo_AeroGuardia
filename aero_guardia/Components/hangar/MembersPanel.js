import { Roboto_Condensed, Montserrat } from "next/font/google";
import { FaCrown } from "react-icons/fa6";
import { FiX } from "react-icons/fi";
import { ROLE_LABELS, ROLE_BADGE_CLASSES, OWNER_BADGE_CLASSES } from "@/lib/hangarRoles";
import { getUserDisplayLabel } from "@/lib/userProfile";

const roboto_condensed = Roboto_Condensed({ weight: ["400", "700"], subsets: ["latin"] });
const heading = Montserrat({ weight: ["700", "800"], subsets: ["latin"] });

function getInitial(label) {
  const value = (label || "").trim();
  return value ? value.charAt(0).toUpperCase() : "?";
}

function MemberRow({ label, isYou, badgeClassName, badgeLabel, badgeIcon }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-mist">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
        {getInitial(label)}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold text-slate-800 ${roboto_condensed.className}`}>
          {label}
          {isYou && <span className="ml-1 font-normal text-slate-400">(tú)</span>}
        </p>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badgeClassName} ${roboto_condensed.className}`}
      >
        {badgeIcon}
        {badgeLabel}
      </span>
    </div>
  );
}

export default function MembersPanel({ hangar, currentUserId, isOpen, onClose, onManage }) {
  if (!hangar) return null;

  const members = hangar.members || [];
  const ownerLabel = getUserDisplayLabel(hangar.owner);
  const isCurrentUserOwner = hangar.isOwner;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[55] bg-navy/45 transition-opacity sm:bg-navy/25 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-[60] flex w-full flex-col bg-white shadow-2xl transition-transform duration-200 sm:w-96 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className={`text-lg text-navy ${heading.className}`}>
            Miembros ({members.length + 1})
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de miembros"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          <MemberRow
            label={ownerLabel}
            isYou={isCurrentUserOwner}
            badgeClassName={OWNER_BADGE_CLASSES}
            badgeLabel="Propietario"
            badgeIcon={<FaCrown className="h-3 w-3" />}
          />

          {members.length === 0 ? (
            <p className={`px-2 py-3 text-sm text-slate-500 ${roboto_condensed.className}`}>
              Nadie más se ha unido todavía.
            </p>
          ) : (
            members.map((member) => (
              <MemberRow
                key={member.userId}
                label={member.displayLabel || member.name || member.email}
                isYou={member.userId === currentUserId}
                badgeClassName={ROLE_BADGE_CLASSES[member.role] || ROLE_BADGE_CLASSES.technician}
                badgeLabel={ROLE_LABELS[member.role] || "Miembro"}
              />
            ))
          )}
        </div>

        {isCurrentUserOwner && (
          <div className="border-t border-slate-200 p-3">
            <button
              type="button"
              onClick={onManage}
              className={`w-full rounded-xl bg-gradient-to-r from-navy to-royal px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 ${roboto_condensed.className}`}
            >
              Administrar miembros
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
