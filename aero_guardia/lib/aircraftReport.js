import { getPendingTaskType } from "./pendingTaskTypes";
import { buildDisplayName } from "./userProfile";

const MONTH_NAMES = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
];

export function formatReportDateLong(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();

    return `${day} de ${month} del ${year}`;
}

export function formatReportDateTime(value) {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function getTaskStatusLabel(status) {
    return status === "completed" ? "Terminado" : "Activo";
}

export function getReportPrintedBy(session) {
    if (!session?.user) {
        return "Usuario";
    }

    const fullName = buildDisplayName(
        session.user.firstNames,
        session.user.lastNames
    );

    return (
        fullName ||
        session.user.username ||
        session.user.name ||
        session.user.email ||
        "Usuario"
    );
}

export function buildAircraftReportData({
    aircraft,
    hangarName = "",
    printedBy = "Usuario",
}) {
    if (!aircraft) {
        return null;
    }

    const tasks = (aircraft.maintenanceTasks || []).map((task, index) => {
        const isCompleted = task.status === "completed";

        return {
            id: task._id,
            index: index + 1,
            title: task.title || "Sin título",
            description: task.description || "—",
            taskType: getPendingTaskType(task),
            status: task.status,
            statusLabel: getTaskStatusLabel(task.status),
            completedByName: isCompleted
                ? task.completedByName || "—"
                : "—",
            completedAt: isCompleted
                ? formatReportDateLong(task.completedAt)
                : "—",
            completionNote: task.completionNote || "—",
        };
    });

    return {
        generatedAt: formatReportDateLong(new Date()),
        printedBy,
        hangarName: hangarName || "—",
        aircraft: {
            registration: aircraft.registration || "—",
            manufacturer: aircraft.manufacturer || "—",
            model: aircraft.model || "—",
            serialNumber: aircraft.serialNumber || "—",
            aircraftType: aircraft.aircraftType || "—",
            stayReason: aircraft.stayReason || "—",
            entryDate: formatReportDateLong(aircraft.entryDate),
            exitDate: formatReportDateLong(aircraft.exitDate),
            status: aircraft.status || "En hangar",
            intakeReportByName: aircraft.intakeReportByName || "—",
        },
        arrivalConditions: (aircraft.arrivalConditions || []).map(
            (item, index) => ({
                index: index + 1,
                title: item.title || "—",
                description: item.description || "—",
                statusLabel: "Activo",
            })
        ),
        stayObservations: (aircraft.stayObservations || []).map(
            (item, index) => ({
                index: index + 1,
                title: item.title || "—",
                description: item.description || "—",
            })
        ),
        tasks,
    };
}

export function getAircraftInfoFields(reportData) {
    return {
        primary: [
            { label: "Matrícula", value: reportData.aircraft.registration },
            { label: "Modelo", value: reportData.aircraft.model },
            { label: "Fabricante", value: reportData.aircraft.manufacturer },
            { label: "N° Serie", value: reportData.aircraft.serialNumber },
            { label: "Tipo", value: reportData.aircraft.aircraftType },
            { label: "Razón de estancia", value: reportData.aircraft.stayReason },
        ],
        secondary: [
            { label: "Hangar", value: reportData.hangarName, colSpan: 2 },
            {
                label: "Reporte de ingreso",
                value: reportData.aircraft.intakeReportByName,
                colSpan: 2,
            },
            {
                label: "Fecha de ingreso",
                value: reportData.aircraft.entryDate,
                colSpan: 1,
            },
            {
                label: "Fecha de salida",
                value: reportData.aircraft.exitDate,
                colSpan: 1,
            },
        ],
    };
}

async function loadImageDataUrl(src) {
    return new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = "anonymous";

        image.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = image.width;
                canvas.height = image.height;
                const context = canvas.getContext("2d");

                if (!context) {
                    resolve(null);
                    return;
                }

                context.drawImage(image, 0, 0);
                resolve({
                    dataUrl: canvas.toDataURL("image/png"),
                    width: image.width,
                    height: image.height,
                });
            } catch {
                resolve(null);
            }
        };

        image.onerror = () => resolve(null);
        image.src = src;
    });
}

function drawUnifiedSectionTable(
    doc,
    autoTable,
    {
        startY,
        margin,
        contentWidth,
        colors,
        tableStyles,
        title,
        headers,
        body,
        columnStyles,
        bodyFontSize,
    }
) {
    autoTable(doc, {
        startY,
        margin: { left: margin, right: margin },
        tableWidth: contentWidth,
        ...tableStyles,
        styles: {
            ...tableStyles.styles,
            ...(bodyFontSize ? { fontSize: bodyFontSize } : {}),
        },
        head: [
            [
                {
                    content: title,
                    colSpan: headers.length,
                    styles: {
                        fillColor: colors.headerBgRgb,
                        fontStyle: "bold",
                        fontSize: 10,
                        halign: "center",
                    },
                },
            ],
            headers,
        ],
        body,
        ...(columnStyles ? { columnStyles } : {}),
    });

    return doc.lastAutoTable.finalY + 8;
}

function drawAircraftInfoSection(
    doc,
    autoTable,
    reportData,
    cursorY,
    pageWidth,
    margin,
    colors,
    sectionTitle
) {
    const contentWidth = pageWidth - margin * 2;
    const { primary, secondary } = getAircraftInfoFields(reportData);

    autoTable(doc, {
        startY: cursorY,
        margin: { left: margin, right: margin },
        tableWidth: contentWidth,
        theme: "grid",
        styles: {
            fontSize: 8,
            cellPadding: 2,
            halign: "center",
            valign: "middle",
            minCellHeight: 14,
            lineColor: colors.border,
            lineWidth: 0.2,
            textColor: colors.text,
        },
        head: [
            [
                {
                    content: sectionTitle,
                    colSpan: 6,
                    styles: {
                        fillColor: colors.headerBgRgb,
                        fontStyle: "bold",
                        fontSize: 10,
                        halign: "center",
                    },
                },
            ],
        ],
        body: [
            new Array(6).fill(" "),
            secondary.map((field) => ({
                content: " ",
                colSpan: field.colSpan,
            })),
        ],
        didDrawCell(data) {
            if (data.section !== "body") {
                return;
            }

            const centerX = data.cell.x + data.cell.width / 2;
            const labelY = data.cell.y + 5;
            const valueY = data.cell.y + 10;

            if (data.row.index === 0) {
                const field = primary[data.column.index];

                if (!field) {
                    return;
                }

                doc.setFont("helvetica", "bold");
                doc.setFontSize(8);
                doc.setTextColor(...colors.textRgb);
                doc.text(field.label, centerX, labelY, { align: "center" });

                doc.setFont("helvetica", "normal");
                doc.text(String(field.value), centerX, valueY, {
                    align: "center",
                });
            }

            if (data.row.index === 1) {
                const field = secondary[data.column.index];

                if (!field) {
                    return;
                }

                doc.setFont("helvetica", "bold");
                doc.setFontSize(8);
                doc.text(field.label, centerX, labelY, { align: "center" });

                doc.setFont("helvetica", "normal");
                doc.text(String(field.value), centerX, valueY, {
                    align: "center",
                });
            }
        },
    });

    return doc.lastAutoTable.finalY + 8;
}

function getTableStyles(colors) {
    return {
        theme: "grid",
        styles: {
            fontSize: 8.5,
            cellPadding: 2.5,
            halign: "center",
            valign: "middle",
            lineColor: colors.border,
            lineWidth: 0.2,
            textColor: colors.text,
        },
        headStyles: {
            fillColor: colors.headerBgRgb,
            textColor: colors.textRgb,
            fontStyle: "bold",
            halign: "center",
        },
        alternateRowStyles: {
            fillColor: [255, 255, 255],
        },
    };
}

function hexToRgb(hex) {
    const normalized = hex.replace("#", "");
    const value = Number.parseInt(normalized, 16);

    return [
        (value >> 16) & 255,
        (value >> 8) & 255,
        value & 255,
    ];
}

export async function downloadAircraftReportPdf(reportData) {
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const {
        AIRCRAFT_REPORT_LOGO_SRC,
        AIRCRAFT_REPORT_COLORS,
        AIRCRAFT_REPORT_TITLE,
        AIRCRAFT_REPORT_SECTIONS,
        AIRCRAFT_REPORT_LOGO,
    } = await import("./aircraftReportConfig");

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let cursorY = 14;

    const colors = {
        border: AIRCRAFT_REPORT_COLORS.border,
        text: AIRCRAFT_REPORT_COLORS.text,
        headerBg: AIRCRAFT_REPORT_COLORS.headerBg,
        borderRgb: hexToRgb(AIRCRAFT_REPORT_COLORS.border),
        textRgb: hexToRgb(AIRCRAFT_REPORT_COLORS.text),
        headerBgRgb: hexToRgb(AIRCRAFT_REPORT_COLORS.headerBg),
    };

    const tableStyles = getTableStyles(colors);
    const logoAsset = await loadImageDataUrl(AIRCRAFT_REPORT_LOGO_SRC);

    if (logoAsset) {
        const logoWidth = AIRCRAFT_REPORT_LOGO.pdfWidth;
        const logoHeight =
            (logoAsset.height / logoAsset.width) * logoWidth;
        const logoX = (pageWidth - logoWidth) / 2;

        doc.addImage(
            logoAsset.dataUrl,
            "PNG",
            logoX,
            cursorY,
            logoWidth,
            logoHeight
        );
        cursorY += logoHeight + 6;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...colors.textRgb);
    doc.text(AIRCRAFT_REPORT_TITLE, pageWidth / 2, cursorY, {
        align: "center",
    });

    cursorY += 10;

    autoTable(doc, {
        startY: cursorY,
        margin: { left: margin, right: margin },
        tableWidth: contentWidth,
        ...tableStyles,
        head: [["Fecha:", "Generado por:"]],
        body: [[reportData.generatedAt, reportData.printedBy]],
    });

    cursorY = doc.lastAutoTable.finalY + 8;

    cursorY = drawAircraftInfoSection(
        doc,
        autoTable,
        reportData,
        cursorY,
        pageWidth,
        margin,
        colors,
        AIRCRAFT_REPORT_SECTIONS.aircraftInfo
    );

    cursorY = drawUnifiedSectionTable(doc, autoTable, {
        startY: cursorY,
        margin,
        contentWidth,
        colors,
        tableStyles,
        title: AIRCRAFT_REPORT_SECTIONS.arrivalConditions,
        headers: ["N°", "Observación / Tipo", "Descripción", "Estado"],
        body:
            reportData.arrivalConditions.length > 0
                ? reportData.arrivalConditions.map((item) => [
                      String(item.index),
                      item.title,
                      item.description,
                      item.statusLabel,
                  ])
                : [["—", "Sin condiciones registradas", "—", "—"]],
        columnStyles: {
            0: { cellWidth: 12 },
            1: { cellWidth: 42 },
            2: { cellWidth: "auto" },
            3: { cellWidth: 24 },
        },
    });

    cursorY = drawUnifiedSectionTable(doc, autoTable, {
        startY: cursorY,
        margin,
        contentWidth,
        colors,
        tableStyles,
        title: AIRCRAFT_REPORT_SECTIONS.stayObservations,
        headers: ["N°", "Observación", "Descripción"],
        body:
            reportData.stayObservations.length > 0
                ? reportData.stayObservations.map((item) => [
                      String(item.index),
                      item.title,
                      item.description,
                  ])
                : [["—", "Sin observaciones registradas", "—"]],
        columnStyles: {
            0: { cellWidth: 12 },
            1: { cellWidth: 48 },
            2: { cellWidth: "auto" },
        },
    });

    cursorY = drawUnifiedSectionTable(doc, autoTable, {
        startY: cursorY,
        margin,
        contentWidth,
        colors,
        tableStyles,
        title: AIRCRAFT_REPORT_SECTIONS.tasks,
        headers: [
            "N°",
            "Pendiente",
            "Tipo",
            "Descripción",
            "Estado",
            "Realizado por",
            "Fecha de cierre",
        ],
        body:
            reportData.tasks.length > 0
                ? reportData.tasks.map((task) => [
                      String(task.index),
                      task.title,
                      task.taskType,
                      task.description,
                      task.statusLabel,
                      task.completedByName,
                      task.completedAt,
                  ])
                : [["—", "Sin pendientes registrados", "—", "—", "—", "—", "—"]],
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 28 },
            2: { cellWidth: 22 },
            3: { cellWidth: "auto" },
            4: { cellWidth: 18 },
            5: { cellWidth: 28 },
            6: { cellWidth: 24 },
        },
        bodyFontSize: 7.5,
    });

    const pageCount = doc.getNumberOfPages();

    for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...colors.textRgb);
        doc.text(
            `AeroGuardia · ${reportData.aircraft.registration}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 8,
            { align: "center" }
        );
    }

    const safeRegistration = reportData.aircraft.registration.replace(
        /[^\w-]+/g,
        "_"
    );

    doc.save(`orden_trabajo_${safeRegistration}.pdf`);
}
