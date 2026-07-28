import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import Header from "@/Components/common/Header";
import { notifyError, notifySuccess } from "@/lib/notifications";

const initialRegisterForm = {
    username: "",
    firstNames: "",
    lastNames: "",
    dateOfBirth: "",
    email: "",
    password: "",
    confirmPassword: "",
};

export default function LoginPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const [mode, setMode] = useState("login");
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [registerForm, setRegisterForm] = useState(initialRegisterForm);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (router.query.mode === "register") {
            setMode("register");
        }
    }, [router.query.mode]);

    useEffect(() => {
        if (status !== "authenticated") {
            return;
        }

        if (session?.user?.profileComplete) {
            router.replace("/inicio");
            return;
        }

        router.replace("/profile");
    }, [status, session, router]);

    useEffect(() => {
        if (router.query.error === "minor") {
            notifyError("Debes ser mayor de edad para acceder");
        }
    }, [router.query.error]);

    const handleLogin = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await signIn("credentials", {
                identifier: identifier.trim(),
                password,
                redirect: false,
            });

            if (result?.error) {
                throw new Error(result.error);
            }

            notifySuccess("Sesión iniciada correctamente");
            // ProfileGate / session effect will send incomplete users to /profile
            router.replace("/inicio");
        } catch (error) {
            notifyError(error.message || "No se pudo iniciar sesión");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegister = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        if (registerForm.password !== registerForm.confirmPassword) {
            notifyError("Las contraseñas no coinciden");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: registerForm.username,
                    firstNames: registerForm.firstNames,
                    lastNames: registerForm.lastNames,
                    dateOfBirth: registerForm.dateOfBirth,
                    email: registerForm.email,
                    password: registerForm.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "No se pudo registrar");
            }

            notifySuccess("Cuenta creada. Inicia sesión para continuar.");
            setMode("login");
            setIdentifier(
                registerForm.email || registerForm.username
            );
            setPassword("");
            setRegisterForm(initialRegisterForm);
        } catch (error) {
            notifyError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === "loading" || session) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <main className="px-4 py-16 text-center text-slate-500">
                    Iniciando sesión...
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <main className="mx-auto max-w-lg px-4 py-10 sm:py-14">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
                    <p className="text-xs uppercase tracking-[0.24em] text-cyan-700/80">
                        Acceso
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold text-slate-950">
                        {mode === "login"
                            ? "Iniciar sesión"
                            : "Crear cuenta"}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        {mode === "login"
                            ? "Usa tu correo electrónico o nombre de usuario."
                            : "Completa tu perfil para acceder a AeroGuardia."}
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                        <button
                            type="button"
                            onClick={() => setMode("login")}
                            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${mode === "login"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            Iniciar sesión
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("register")}
                            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${mode === "register"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                        >
                            Registrarse
                        </button>
                    </div>

                    {mode === "login" ? (
                        <form
                            onSubmit={handleLogin}
                            className="mt-6 space-y-4"
                        >
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Correo o nombre de usuario
                                </label>
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(event) =>
                                        setIdentifier(event.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                    placeholder="correo@ejemplo.com o usuario"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                            >
                                {isSubmitting
                                    ? "Ingresando..."
                                    : "Iniciar sesión"}
                            </button>
                        </form>
                    ) : (
                        <form
                            onSubmit={handleRegister}
                            className="mt-6 space-y-4"
                        >
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Nombre de usuario
                                </label>
                                <input
                                    type="text"
                                    value={registerForm.username}
                                    onChange={(event) =>
                                        setRegisterForm((current) => ({
                                            ...current,
                                            username: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                    placeholder="usuario_123"
                                    required
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    3-24 caracteres. Solo letras minúsculas,
                                    números y guion bajo.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Nombre(s)
                                    </label>
                                    <input
                                        type="text"
                                        value={registerForm.firstNames}
                                        onChange={(event) =>
                                            setRegisterForm((current) => ({
                                                ...current,
                                                firstNames:
                                                    event.target.value,
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
                                        value={registerForm.lastNames}
                                        onChange={(event) =>
                                            setRegisterForm((current) => ({
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
                                    value={registerForm.dateOfBirth}
                                    onChange={(event) =>
                                        setRegisterForm((current) => ({
                                            ...current,
                                            dateOfBirth: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Correo electrónico
                                </label>
                                <input
                                    type="email"
                                    value={registerForm.email}
                                    onChange={(event) =>
                                        setRegisterForm((current) => ({
                                            ...current,
                                            email: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                    required
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        value={registerForm.password}
                                        onChange={(event) =>
                                            setRegisterForm((current) => ({
                                                ...current,
                                                password: event.target.value,
                                            }))
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Confirmar contraseña
                                    </label>
                                    <input
                                        type="password"
                                        value={registerForm.confirmPassword}
                                        onChange={(event) =>
                                            setRegisterForm((current) => ({
                                                ...current,
                                                confirmPassword:
                                                    event.target.value,
                                            }))
                                        }
                                        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-slate-900 outline-none transition focus:border-cyan-400"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                            >
                                {isSubmitting
                                    ? "Registrando..."
                                    : "Crear cuenta"}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 border-t border-slate-200 pt-6">
                        <button
                            type="button"
                            onClick={() =>
                                signIn("google", {
                                    callbackUrl: "/inicio",
                                })
                            }
                            className="flex w-full items-center justify-center gap-3 rounded-full border 
                            border-slate-200 bg-cyan-400 px-5 py-3 text-sm font-medium text-white transition
                             hover:bg-cyan-600 duration-300"
                        >
                            Continuar con Google
                        </button>
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                        <Link
                            href="/"
                            className="flex w-full items-center justify-center rounded-full border 
                            border-black bg-white px-5 py-3 text-sm font-medium transition
                             hover:bg-slate-200 duration-300"
                        >
                            <p className="text-center text-black">
                                Volver al inicio
                            </p>

                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
