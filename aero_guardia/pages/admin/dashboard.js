import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

import Header from "@/Components/common/Header";
import {
    formatAdminDateTime,
    formatChartDate,
} from "@/lib/adminDashboard";

const cardClass =
    "min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg sm:p-6";

function StatCard({ label, value, hint, accentClass }) {
    return (
        <article className={cardClass}>
            <p
                className={`text-xs font-semibold uppercase tracking-[0.24em] ${accentClass}`}
            >
                {label}
            </p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">
                {value}
            </p>
            <p className="mt-2 text-sm text-slate-500">{hint}</p>
        </article>
    );
}

function TimelineChart({ title, description, data, barClass, totalLabel }) {
    const maxCount = useMemo(
        () => Math.max(...data.map((point) => point.count), 1),
        [data]
    );

    const total = useMemo(
        () => data.reduce((sum, point) => sum + point.count, 0),
        [data]
    );

    const peak = useMemo(() => {
        if (data.length === 0) {
            return null;
        }

        return data.reduce((best, point) =>
            point.count > best.count ? point : best
        );
    }, [data]);

    return (
        <article className={cardClass}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                        {title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {description}
                    </p>
                </div>
                <div className="text-left sm:text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {totalLabel}
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">
                        {total}
                    </p>
                    {peak && peak.count > 0 && (
                        <p className="mt-1 text-xs text-slate-500">
                            Pico: {peak.count} el{" "}
                            {formatChartDate(peak.date)}
                        </p>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto pb-2">
                <div className="flex min-w-[720px] items-end gap-2">
                    {data.map((point, index) => {
                        const heightPercent = Math.max(
                            (point.count / maxCount) * 100,
                            point.count > 0 ? 8 : 2
                        );
                        const showLabel =
                            index === 0 ||
                            index === data.length - 1 ||
                            index % 5 === 0;

                        return (
                            <div
                                key={point.date}
                                className="flex min-w-0 flex-1 flex-col items-center gap-2"
                            >
                                <span className="text-[10px] font-medium text-slate-500">
                                    {point.count > 0 ? point.count : ""}
                                </span>
                                <div
                                    className="flex h-40 w-full items-end"
                                    title={`${formatChartDate(point.date)}: ${point.count} registro(s)`}
                                >
                                    <div
                                        className={`w-full rounded-t-lg transition ${barClass} ${
                                            point.count === 0
                                                ? "opacity-30"
                                                : ""
                                        }`}
                                        style={{
                                            height: `${heightPercent}%`,
                                        }}
                                    />
                                </div>
                                <span className="h-8 text-center text-[10px] leading-4 text-slate-400">
                                    {showLabel
                                        ? formatChartDate(point.date, {
                                              short: true,
                                          })
                                        : ""}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </article>
    );
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (status === "loading") {
            return;
        }

        if (status !== "authenticated") {
            router.replace("/inicio");
            return;
        }

        if (session?.user?.role !== "admin") {
            router.replace("/inicio");
            return;
        }

        const loadDashboard = async () => {
            try {
                const response = await fetch("/api/admin/dashboard");
                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401) {
                        router.replace("/inicio");
                        return;
                    }

                    throw new Error(
                        data.error || "No se pudo cargar el dashboard"
                    );
                }

                setDashboard(data);
            } catch (error) {
                if (error?.message) {
                    setErrorMessage(error.message);
                }
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [router, session, status]);

    const statusItems = useMemo(
        () => dashboard?.statusBreakdown || [],
        [dashboard]
    );

    const timelineDays = dashboard?.timelines?.days || 30;

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
            <Header />

            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
                <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <Link
                        href="/"
                        className="font-medium text-cyan-700 transition hover:text-cyan-800"
                    >
                        Inicio
                    </Link>
                    <span>/</span>
                    <span className="font-medium text-slate-700">
                        Panel administrador
                    </span>
                </div>

                <section className={`${cardClass} mb-8`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-cyan-700/80">
                                AeroGuardia Admin
                            </p>
                            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
                                Dashboard de control
                            </h1>
                            <p className="mt-2 max-w-3xl text-sm text-slate-500">
                                Vista general del sistema: usuarios, hangares
                                activos y registros por fecha en los últimos{" "}
                                {timelineDays} días.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/inicio"
                                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
                            >
                                Ir a hangares
                            </Link>
                            <Link
                                href="/pending"
                                className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500"
                            >
                                Ver pendientes
                            </Link>
                        </div>
                    </div>
                </section>

                {errorMessage && (
                    <p className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {errorMessage}
                    </p>
                )}

                {loading ? (
                    <div className={cardClass}>
                        <p className="text-sm text-slate-500">
                            Cargando métricas del dashboard...
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                label="Usuarios"
                                value={dashboard?.stats?.usersCount || 0}
                                hint="Cuentas registradas"
                                accentClass="text-cyan-700/80"
                            />
                            <StatCard
                                label="Hangares"
                                value={dashboard?.stats?.hangarsCount || 0}
                                hint="Espacios creados"
                                accentClass="text-cyan-700/80"
                            />
                            <StatCard
                                label="Aeronaves"
                                value={dashboard?.stats?.aircraftCount || 0}
                                hint={`${dashboard?.stats?.activeAircraftCount || 0} activas en hangar`}
                                accentClass="text-cyan-700/80"
                            />
                            <StatCard
                                label="Reportes"
                                value={dashboard?.stats?.reportsCount || 0}
                                hint="Observaciones acumuladas"
                                accentClass="text-amber-700/80"
                            />
                        </section>

                        <section className="space-y-6">
                            <div>
                                <h2 className="text-2xl font-semibold text-slate-950">
                                    Registros por fecha
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Comparativa diaria de altas en los últimos{" "}
                                    {timelineDays} días.
                                </p>
                            </div>

                            <TimelineChart
                                title="Usuarios registrados"
                                description="Días con mayor conexión o creación de cuentas."
                                data={dashboard?.timelines?.users || []}
                                barClass="bg-cyan-500"
                                totalLabel="Nuevos usuarios"
                            />

                            <TimelineChart
                                title="Hangares creados"
                                description="Crecimiento de hangares según fecha de alta."
                                data={dashboard?.timelines?.hangars || []}
                                barClass="bg-slate-800"
                                totalLabel="Nuevos hangares"
                            />

                            <TimelineChart
                                title="Aeronaves registradas"
                                description="Ingresos de aeronaves al sistema por día."
                                data={dashboard?.timelines?.aircraft || []}
                                barClass="bg-amber-500"
                                totalLabel="Nuevas aeronaves"
                            />
                        </section>

                        <section className="grid gap-6 xl:grid-cols-2">
                            <article className={cardClass}>
                                <div className="mb-5">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                        Usuarios activos
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                                        Cuentas del sistema
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Usuarios registrados, ordenados por fecha
                                        de alta.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {dashboard?.activeUsers?.length > 0 ? (
                                        dashboard.activeUsers.map((user) => (
                                            <div
                                                key={user._id}
                                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                                            >
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            {user.name}
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            {user.email}
                                                        </p>
                                                        <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                                                            {user.role ===
                                                            "admin"
                                                                ? "Administrador"
                                                                : "Usuario"}
                                                        </span>
                                                    </div>
                                                    <div className="text-left text-xs text-slate-500 sm:text-right">
                                                        <p>
                                                            Alta:{" "}
                                                            {formatAdminDateTime(
                                                                user.createdAt
                                                            )}
                                                        </p>
                                                        {user.lastLogin && (
                                                            <p className="mt-1">
                                                                Último acceso:{" "}
                                                                {formatAdminDateTime(
                                                                    user.lastLogin
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">
                                            No hay usuarios registrados.
                                        </p>
                                    )}
                                </div>
                            </article>

                            <article className={cardClass}>
                                <div className="mb-5">
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                        Hangares activos
                                    </p>
                                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                                        Espacios operativos
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Hangares con su carga de aeronaves y
                                        miembros.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {dashboard?.activeHangars?.length > 0 ? (
                                        dashboard.activeHangars.map(
                                            (hangar) => (
                                                <div
                                                    key={hangar._id}
                                                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                                                >
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div>
                                                            <p className="font-medium text-slate-900">
                                                                {hangar.name}
                                                            </p>
                                                            <p className="text-sm text-slate-500">
                                                                {hangar.location ||
                                                                    "Sin ubicación"}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                Propietario:{" "}
                                                                {hangar.ownerName ||
                                                                    "Sin nombre"}
                                                            </p>
                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-800">
                                                                    {
                                                                        hangar.aircraftCount
                                                                    }{" "}
                                                                    aeronave
                                                                    {hangar.aircraftCount ===
                                                                    1
                                                                        ? ""
                                                                        : "s"}
                                                                </span>
                                                                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                                                                    {
                                                                        hangar.membersCount
                                                                    }{" "}
                                                                    miembro
                                                                    {hangar.membersCount ===
                                                                    1
                                                                        ? ""
                                                                        : "s"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-slate-500">
                                                            Creado:{" "}
                                                            {formatAdminDateTime(
                                                                hangar.createdAt
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        )
                                    ) : (
                                        <p className="text-sm text-slate-500">
                                            No hay hangares registrados.
                                        </p>
                                    )}
                                </div>
                            </article>
                        </section>

                        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                            <article className={cardClass}>
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                    Salud operativa
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                                    Estado de aeronaves
                                </h2>

                                {statusItems.length > 0 ? (
                                    <div className="mt-5 space-y-3">
                                        {statusItems.map((item) => (
                                            <div
                                                key={item._id || item.status}
                                                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {item._id ||
                                                            "Sin estado"}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Categoría de seguimiento
                                                    </p>
                                                </div>
                                                <p className="text-2xl font-semibold text-cyan-700">
                                                    {item.count}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-5 text-sm text-slate-500">
                                        Todavía no hay aeronaves para evaluar.
                                    </p>
                                )}
                            </article>

                            <article className={cardClass}>
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                    Seguimiento reciente
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                                    Últimas aeronaves
                                </h2>

                                <div className="mt-5 space-y-3">
                                    {dashboard?.recentAircraft?.length > 0 ? (
                                        dashboard.recentAircraft.map(
                                            (aircraft) => (
                                                <div
                                                    key={aircraft._id}
                                                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-medium text-slate-900">
                                                                {
                                                                    aircraft.registration
                                                                }
                                                            </p>
                                                            <p className="text-sm text-slate-500">
                                                                {aircraft.manufacturer ||
                                                                    aircraft.model}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                Hangar:{" "}
                                                                {aircraft
                                                                    .hangar
                                                                    ?.name ||
                                                                    "Sin hangar"}
                                                            </p>
                                                        </div>
                                                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                                                            {aircraft.status ||
                                                                "En hangar"}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        )
                                    ) : (
                                        <p className="text-sm text-slate-500">
                                            No hay aeronaves recientes.
                                        </p>
                                    )}
                                </div>
                            </article>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}
