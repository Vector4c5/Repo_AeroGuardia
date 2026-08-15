import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Montserrat } from "next/font/google";
import { Roboto_Condensed } from "next/font/google";

import Header from "@/Components/common/Header";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { formatDateInput } from "@/lib/userProfile";

const jersey_10 = Montserrat({ weight: ["700", "800"], subsets: ["latin"] });
const roboto_condensed = Roboto_Condensed({
  weight: ["400", "700"],
  subsets: ["latin"],
});

const emptyForm = {
  username: "",
  firstNames: "",
  lastNames: "",
  dateOfBirth: "",
};

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isIncomplete = Boolean(
    session?.user && !session.user.profileComplete
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") {
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);

      try {
        const response = await fetch("/api/profile");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No se pudo cargar el perfil");
        }

        setProfile(data.profile);
        setForm({
          username: data.profile.username || "",
          firstNames: data.profile.firstNames || "",
          lastNames: data.profile.lastNames || "",
          dateOfBirth: formatDateInput(data.profile.dateOfBirth),
        });
      } catch (error) {
        notifyError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [status]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    const completingSetup = isIncomplete;

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          await signOut({ callbackUrl: "/login?error=minor" });
        }

        throw new Error(data.error || "No se pudo actualizar el perfil");
      }

      setProfile(data.profile);
      await update();
      notifySuccess(
        completingSetup
          ? "Registro completado. Bienvenido a AeroGuardia."
          : "Perfil actualizado correctamente"
      );

      if (completingSetup) {
        router.replace("/inicio");
      }
    } catch (error) {
      notifyError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo eliminar el perfil");
      }

      notifySuccess("Perfil eliminado correctamente");
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      notifyError(error.message);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className={`text-slate-600 ${roboto_condensed.className}`}>
          Cargando perfil...
        </p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className={`text-slate-600 ${roboto_condensed.className}`}>
          Redirigiendo al inicio de sesión...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {!isIncomplete && <Header />}

      {isIncomplete && (
        <div className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <img
              src="/Logo_AeroGuardia_Icon.png"
              alt="AeroGuardia"
              className="h-10 w-10 rounded-full border-2 border-white object-cover shadow"
            />
            <h1 className={`text-2xl tracking-tight text-black sm:text-3xl ${jersey_10.className}`}>
              AeroGuardia
            </h1>
          </div>
        </div>
      )}

      <main
        className={`mx-auto max-w-3xl px-4 py-8 sm:py-12 ${
          isIncomplete ? "" : ""
        }`}
      >
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-700/80">
            {isIncomplete ? "Registro" : "Cuenta"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            {isIncomplete ? "Completa tu perfil" : "Mi perfil"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {isIncomplete
              ? "Debes guardar tus datos para continuar. No podrás salir de esta pantalla hasta completar el registro."
              : "Actualiza tus datos básicos. El nombre de usuario debe ser único."}
          </p>

          {isIncomplete && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Completa usuario, nombres, apellidos y fecha de nacimiento para
              acceder a tus hangares.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Correo electrónico
              </label>
              <input
                type="email"
                value={profile?.email || session.user?.email || ""}
                readOnly
                className="w-full rounded-lg border border-slate-200 bg-slate-100 p-3 text-slate-600"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nombre de usuario
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Puedes iniciar sesión con este usuario o con tu correo.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nombre(s)
                </label>
                <input
                  type="text"
                  value={form.firstNames}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      firstNames: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Apellidos
                </label>
                <input
                  type="text"
                  value={form.lastNames}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      lastNames: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Fecha de nacimiento
              </label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dateOfBirth: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Debes ser mayor de edad para acceder.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
              >
                {isSaving
                  ? "Guardando..."
                  : isIncomplete
                    ? "Guardar y continuar"
                    : "Guardar cambios"}
              </button>

              {!isIncomplete && (
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="rounded-full border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  Borrar perfil
                </button>
              )}

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cerrar sesión
              </button>
            </div>
          </form>
        </section>
      </main>

      {isDeleteModalOpen && !isIncomplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar confirmación de borrado"
            onClick={() => setIsDeleteModalOpen(false)}
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
          />

          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-950">
              ¿Estás seguro?
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Esta acción eliminará tu perfil de forma permanente, incluyendo
              los hangares que poseas y sus aeronaves. No se puede deshacer.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteProfile}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-rose-600 px-4 py-2 font-medium text-white transition hover:bg-rose-500 disabled:opacity-70"
              >
                {isDeleting ? "Borrando..." : "Sí, borrar perfil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
