import { useEffect, useRef, useState } from "react";
import {
    AIRCRAFT_REPORT_COLORS,
    AIRCRAFT_REPORT_LOGO,
    AIRCRAFT_REPORT_LOGO_SRC,
    AIRCRAFT_REPORT_PREVIEW_WIDTH_PX,
    AIRCRAFT_REPORT_SECTIONS,
    AIRCRAFT_REPORT_TITLE,
} from "@/lib/aircraftReportConfig";
import { getAircraftInfoFields } from "@/lib/aircraftReport";

function ScaledDocumentFrame({ children }) {
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [frameHeight, setFrameHeight] = useState(0);

    useEffect(() => {
        const updateScale = () => {
            const container = containerRef.current;
            const content = contentRef.current;
            if (!container || !content) {
                return;
            }

            const availableWidth = container.clientWidth;
            const nextScale = Math.min(
                1,
                availableWidth / AIRCRAFT_REPORT_PREVIEW_WIDTH_PX
            );

            setScale(nextScale);
            setFrameHeight(content.offsetHeight * nextScale);
        };

        updateScale();

        const resizeObserver = new ResizeObserver(updateScale);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        if (contentRef.current) {
            resizeObserver.observe(contentRef.current);
        }

        return () => resizeObserver.disconnect();
    }, [children]);

    return (
        <div ref={containerRef} className="w-full overflow-hidden">
            <div
                className="mx-auto"
                style={{
                    width: AIRCRAFT_REPORT_PREVIEW_WIDTH_PX * scale,
                    height: frameHeight || undefined,
                }}
            >
                <div
                    ref={contentRef}
                    className="origin-top-left"
                    style={{
                        width: AIRCRAFT_REPORT_PREVIEW_WIDTH_PX,
                        transform: `scale(${scale})`,
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

function UnifiedSectionTable({ title, headers, rows, compact = false }) {
    return (
        <div className="overflow-hidden border border-black">
            <table className="w-full border-collapse text-center text-sm">
                <thead>
                    <tr className="bg-slate-100">
                        <th
                            colSpan={headers.length}
                            className="border border-black px-3 py-2 text-sm font-bold uppercase tracking-wide text-slate-900"
                        >
                            {title}
                        </th>
                    </tr>
                    <tr className="bg-slate-100">
                        {headers.map((header) => (
                            <th
                                key={header}
                                className="border border-black px-2 py-2 text-xs font-bold uppercase tracking-wide text-slate-900"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={`row-${rowIndex}`} className="bg-white">
                            {row.map((cell, cellIndex) => (
                                <td
                                    key={`cell-${rowIndex}-${cellIndex}`}
                                    className={`border border-black px-2 align-middle text-slate-900 ${
                                        compact ? "py-2 text-xs" : "py-3"
                                    }`}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ReportTable({ headers, rows, compact = false }) {
    return (
        <div className="overflow-hidden border border-black">
            <table className="w-full border-collapse text-center text-sm">
                {headers && (
                    <thead>
                        <tr className="bg-slate-100">
                            {headers.map((header) => (
                                <th
                                    key={header}
                                    className="border border-black px-2 py-2 text-xs font-bold uppercase tracking-wide text-slate-900"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                )}
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={`row-${rowIndex}`} className="bg-white">
                            {row.map((cell, cellIndex) => (
                                <td
                                    key={`cell-${rowIndex}-${cellIndex}`}
                                    className={`border border-black px-2 align-middle text-slate-900 ${
                                        compact ? "py-2 text-xs" : "py-3"
                                    }`}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function StackedCell({ label, value }) {
    return (
        <div className="px-2 py-2.5">
            <p className="text-xs font-bold leading-tight text-slate-950">
                {label}
            </p>
            <p className="mt-1 text-xs font-normal leading-snug text-slate-800">
                {value}
            </p>
        </div>
    );
}

function AircraftInfoTable({ title, primaryFields, secondaryFields }) {
    return (
        <div className="overflow-hidden border border-black">
            <table className="w-full table-fixed border-collapse text-center">
                <thead>
                    <tr className="bg-slate-100">
                        <th
                            colSpan={6}
                            className="border border-black px-3 py-2 text-sm font-bold uppercase tracking-wide text-slate-900"
                        >
                            {title}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        {primaryFields.map((field) => (
                            <td
                                key={field.label}
                                className="border border-black align-middle"
                            >
                                <StackedCell
                                    label={field.label}
                                    value={field.value}
                                />
                            </td>
                        ))}
                    </tr>
                    <tr>
                        {secondaryFields.map((field) => (
                            <td
                                key={field.label}
                                colSpan={field.colSpan}
                                className="border border-black align-middle"
                            >
                                <StackedCell
                                    label={field.label}
                                    value={field.value}
                                />
                            </td>
                        ))}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default function AircraftReportPreview({ reportData }) {
    if (!reportData) {
        return null;
    }

    const { primary: aircraftPrimaryFields, secondary: aircraftSecondaryFields } =
        getAircraftInfoFields(reportData);

    const arrivalRows =
        reportData.arrivalConditions.length > 0
            ? reportData.arrivalConditions.map((item) => [
                  String(item.index),
                  item.title,
                  item.description,
                  item.statusLabel,
              ])
            : [["—", "Sin condiciones registradas", "—", "—"]];

    const observationRows =
        reportData.stayObservations.length > 0
            ? reportData.stayObservations.map((item) => [
                  String(item.index),
                  item.title,
                  item.description,
              ])
            : [["—", "Sin observaciones registradas", "—"]];

    const taskRows =
        reportData.tasks.length > 0
            ? reportData.tasks.map((task) => [
                  String(task.index),
                  task.title,
                  task.taskType,
                  task.description,
                  <span
                      key={`${task.id}-status`}
                      className={
                          task.status === "completed"
                              ? "font-semibold text-slate-900"
                              : "font-semibold text-slate-700"
                      }
                  >
                      {task.statusLabel}
                  </span>,
                  task.completedByName,
                  task.completedAt,
              ])
            : [["—", "Sin pendientes registrados", "—", "—", "—", "—", "—"]];

    return (
        <ScaledDocumentFrame>
            <div
                className="bg-white px-8 py-10 text-slate-900"
                style={{
                    width: AIRCRAFT_REPORT_PREVIEW_WIDTH_PX,
                    color: AIRCRAFT_REPORT_COLORS.text,
                }}
            >
            <div className="flex flex-col items-center text-center">
                <img
                    src={AIRCRAFT_REPORT_LOGO_SRC}
                    alt="Logo AeroGuardia"
                    className={`${AIRCRAFT_REPORT_LOGO.previewHeightClass} w-auto object-contain`}
                    onError={(event) => {
                        event.currentTarget.style.display = "none";
                    }}
                />

                <h1 className="mt-5 text-2xl font-bold uppercase tracking-[0.18em] text-slate-950">
                    {AIRCRAFT_REPORT_TITLE}
                </h1>
            </div>

            <div className="mx-auto mt-8 max-w-2xl">
                <ReportTable
                    headers={["Fecha:", "Generado por:"]}
                    rows={[[reportData.generatedAt, reportData.printedBy]]}
                    compact
                />
            </div>

            <div className="mt-8">
                <AircraftInfoTable
                    title={AIRCRAFT_REPORT_SECTIONS.aircraftInfo}
                    primaryFields={aircraftPrimaryFields}
                    secondaryFields={aircraftSecondaryFields}
                />
            </div>

            <div className="mt-8">
                <UnifiedSectionTable
                    title={AIRCRAFT_REPORT_SECTIONS.arrivalConditions}
                    headers={[
                        "N°",
                        "Observación / Tipo",
                        "Descripción",
                        "Estado",
                    ]}
                    rows={arrivalRows}
                    compact
                />
            </div>

            <div className="mt-8">
                <UnifiedSectionTable
                    title={AIRCRAFT_REPORT_SECTIONS.stayObservations}
                    headers={["N°", "Observación", "Descripción"]}
                    rows={observationRows}
                    compact
                />
            </div>

            <div className="mt-8">
                <UnifiedSectionTable
                    title={AIRCRAFT_REPORT_SECTIONS.tasks}
                    headers={[
                        "N°",
                        "Pendiente",
                        "Tipo",
                        "Descripción",
                        "Estado",
                        "Realizado por",
                        "Fecha de cierre",
                    ]}
                    rows={taskRows}
                    compact
                />
            </div>

            <p className="mt-10 text-center text-xs text-slate-500">
                AeroGuardia · {reportData.aircraft.registration}
            </p>
            </div>
        </ScaledDocumentFrame>
    );
}
