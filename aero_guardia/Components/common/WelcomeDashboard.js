import Link from "next/link";
import { Montserrat, Roboto_Condensed } from "next/font/google";
import { AiFillSafetyCertificate } from "react-icons/ai";
import {
  FaComputer,
  FaBell,
  FaMicrochip,
  FaLaptopCode,
  FaPlaneLock,
  FaScrewdriverWrench,
  FaUserGroup,
  FaTriangleExclamation,
  FaEnvelope,
} from "react-icons/fa6";
import { FaClipboardList, FaFilePdf } from "react-icons/fa";
import { BiSolidPlaneAlt } from "react-icons/bi";
import { IoHardwareChip } from "react-icons/io5";
import { MdKeyboardArrowDown } from "react-icons/md";
import ScrollReveal from "@/Components/common/ScrollReveal";
import GradientBlobs from "@/Components/common/GradientBlobs";

const heading = Montserrat({ weight: ["700", "800"], subsets: ["latin"] });
const body = Roboto_Condensed({ weight: ["400", "700"], subsets: ["latin"] });

// Rotación de acentos de marca (navy/royal/gold/sky) para íconos e insignias.
const ACCENTS = ["bg-royal shadow-royal/30", "bg-sky shadow-sky/30", "bg-gold shadow-gold/30"];

const TEAM = [
  { icon: FaLaptopCode, name: "Héctor Hernández", role: "Desarrollador Full Stack" },
  { icon: FaMicrochip, name: "Carlo Emiliano Rodríguez Carmona", role: "Ingeniería e Integración de Hardware" },
];

const MISSION_VISION = [
  {
    title: "Misión",
    accent: "border-royal",
    text: "Garantizar la seguridad y la trazabilidad en hangares aeronáuticos mediante soluciones tecnológicas que integren el control de accesos y la gestión digital de la información, mejorando la confiabilidad y el control operativo en la aviación general.",
  },
  {
    title: "Visión",
    accent: "border-gold",
    text: "Ser una empresa líder en la gestión y seguridad de hangares aeronáuticos, reconocida a nivel nacional por su confiabilidad, innovación tecnológica y enfoque en la trazabilidad, contribuyendo al desarrollo ordenado y eficiente de la infraestructura aeroportuaria.",
  },
];

const VALUES = [
  { name: "Honestidad", text: "Transparencia total con los usuarios sobre el manejo de su información." },
  { name: "Trazabilidad", text: "Control total, eficiente y confiable de lo que ocurre dentro del hangar." },
  { name: "Seguridad", text: "Protección de aeronaves, instalaciones y personal con herramientas confiables." },
  { name: "Responsabilidad", text: "Actuar de forma ética y profesional en cada proceso y servicio." },
  { name: "Eficiencia", text: "Optimizar los procesos administrativos y operativos del hangar." },
  { name: "Confianza", text: "Sistemas transparentes y precisos que dan tranquilidad a los usuarios." },
];

const STEPS = [
  {
    icon: FaClipboardList,
    title: "1. Registro digital",
    text: "Cada aeronave y cada persona autorizada del hangar queda dada de alta en el sistema.",
  },
  {
    icon: FaPlaneLock,
    title: "2. Acceso por RFID",
    text: "Al pasar su tarjeta en la entrada, el lector confirma la identidad y registra el evento al momento.",
  },
  {
    icon: FaFilePdf,
    title: "3. Reportes automáticos",
    text: "La plataforma genera el reporte de cada aeronave — condiciones, observaciones y pendientes — listo en PDF.",
  },
];

const FEATURES = [
  {
    icon: AiFillSafetyCertificate,
    title: "Control de accesos",
    text: "Cada persona que entra o sale del hangar queda registrada, sin depender de una bitácora en papel.",
  },
  {
    icon: FaComputer,
    title: "Monitoreo en tiempo real",
    text: "El estado de tus aeronaves y los eventos de acceso se actualizan al instante en la plataforma.",
  },
  {
    icon: FaBell,
    title: "Alertas automáticas",
    text: "Te avisamos de lo que necesita tu atención, sin que tengas que ir a buscarlo.",
  },
];

const FUNCTIONS = [
  {
    icon: FaClipboardList,
    title: "Registro digital de aeronaves",
    text: "Alta completa por hangar: fabricante, número de serie, tipo, motivo de estadía, condiciones de llegada y observaciones.",
  },
  {
    icon: FaPlaneLock,
    title: "Control de acceso RFID",
    text: "Lector físico en la entrada del hangar que identifica cada tarjeta y registra entradas y salidas de personal en tiempo real.",
  },
  {
    icon: FaScrewdriverWrench,
    title: "Seguimiento de mantenimiento",
    text: "Tareas pendientes por aeronave, clasificadas por tipo (documentación, mantenimiento, inspección, pruebas), con responsable y estado.",
  },
  {
    icon: FaFilePdf,
    title: "Reportes automáticos en PDF",
    text: "El reporte de cada aeronave —condiciones, observaciones y pendientes— listo para descargar.",
  },
  {
    icon: FaUserGroup,
    title: "Gestión multi-hangar con roles",
    text: "Administra varios hangares con roles de administrador, ingeniero y técnico, e invita miembros con un código temporal.",
  },
  {
    icon: FaTriangleExclamation,
    title: "Monitoreo de emergencias",
    text: "Panel en tiempo real de accesos denegados, para reaccionar de inmediato ante un intento no autorizado.",
  },
];

const PRICING = [
  {
    icon: BiSolidPlaneAlt,
    name: "Plan Mensual",
    price: "$4,500",
    text: "Acceso completo a la plataforma, actualizaciones regulares y soporte técnico dedicado. Ideal para hangares pequeños que buscan una solución flexible y sin compromisos a largo plazo.",
    featured: false,
  },
  {
    icon: BiSolidPlaneAlt,
    name: "Plan Anual",
    price: "$48,600",
    text: "Acceso completo a la plataforma, actualizaciones regulares y soporte técnico dedicado. Incluye 10% de descuento frente al plan mensual, la opción perfecta para hangares que buscan una solución a largo plazo.",
    featured: true,
  },
  {
    icon: IoHardwareChip,
    name: "Cuota de Implementación",
    price: "$25,500",
    text: "Pago único de instalación del hardware de control de acceso RFID en tu hangar, previo al inicio de tu suscripción mensual o anual.",
    featured: false,
  },
];

function IconBadge({ icon: Icon, accent, size = 26 }) {
  return (
    <div className={`mx-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg sm:h-16 sm:w-16 ${accent}`}>
      <Icon size={size} />
    </div>
  );
}

function Kicker({ children, color = "text-royal" }) {
  return (
    <span className={`text-xs font-bold uppercase tracking-[0.25em] ${color}`}>
      {children}
    </span>
  );
}

function CtaButton({ href, label, variant = "dark", external = false }) {
  const styles =
    variant === "light"
      ? "bg-white text-slate-900 hover:bg-slate-100"
      : variant === "outline"
        ? "border-2 border-white/80 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
        : "bg-gradient-to-r from-navy to-royal text-white hover:brightness-110";
  const className = `w-full rounded-xl p-3 shadow-md transition duration-300 hover:scale-[0.98] hover:shadow-lg sm:w-8/12 md:w-7/12 lg:w-6/12 xl:w-5/12 ${styles}`;
  const content = (
    <p className={`${heading.className} whitespace-nowrap text-center text-lg sm:text-2xl md:text-3xl lg:text-4xl`}>
      {label}
    </p>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

export default function WelcomeDashboard({ ctaHref = "/login" }) {
  return (
    <div className="relative z-10 w-full">
      {/* Hero */}
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center gap-4 overflow-hidden px-4 text-center sm:gap-6 sm:px-6">
        <img
          src="/hero-ramp.jpg"
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/75 via-slate-950/55 to-slate-950/80"
        />

        <div className="relative z-10 flex w-full flex-col items-center gap-4 sm:gap-6">
          <img
            src="/Logo_AeroGuardia.png"
            alt="Logo de AeroGuardia"
            className="w-52 rounded-3xl bg-white p-3 shadow-2xl shadow-black/40 sm:w-60 md:w-72"
          />
          <span
            className={`${body.className} rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/80 backdrop-blur-sm sm:text-sm`}
          >
            Gestión de hangares aeronáuticos
          </span>
          <h1
            className={`${heading.className} tracking-tight text-4xl text-white sm:text-5xl md:text-6xl lg:text-7xl`}
          >
            Bienvenido a AeroGuardia
          </h1>
          <p className={`${body.className} max-w-xl text-base text-slate-100 sm:text-lg`}>
            Registro de aeronaves, control de acceso y reportes de tu hangar — todo en un
            mismo lugar, sin depender del papel.
          </p>

          <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <CtaButton href={ctaHref} label="Iniciar sesión" variant="light" />
            <CtaButton
              href="https://info-aero-guardia.vercel.app/"
              label="Conoce AeroGuardia"
              variant="outline"
              external
            />
          </div>

          <MdKeyboardArrowDown className="mt-8 animate-bounce text-3xl text-white/80" />
        </div>
      </section>

      {/* Quiénes somos */}
      <section className="w-full bg-white px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto w-full max-w-5xl">
          <ScrollReveal className="text-center">
            <Kicker color="text-royal">¿Quiénes somos?</Kicker>
            <h2 className={`${heading.className} mt-2 tracking-tight text-3xl text-navy sm:text-4xl`}>
              La tecnología detrás de tu hangar
            </h2>
            <p className={`${body.className} mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg`}>
              Nos definimos como los creadores de AeroGuardia, una iniciativa tecnológica que busca
              transformar la administración de hangares de pequeña y mediana escala. Nuestra fortaleza
              reside en la capacidad de combinar el desarrollo de software avanzado con la implementación
              de hardware físico, con el fin de eliminar la dependencia de procesos manuales y elevar los
              estándares de seguridad operacional en las instalaciones aeroportuarias.
            </p>
          </ScrollReveal>

          <div className="mx-auto mt-10 grid max-w-2xl gap-6 sm:grid-cols-2">
            {TEAM.map((member, index) => (
              <ScrollReveal
                key={member.name}
                delay={index * 150}
                className="flex flex-col items-center gap-3 rounded-3xl bg-mist p-6 text-center shadow-md shadow-navy/5 transition hover:-translate-y-1 hover:shadow-xl sm:p-8"
              >
                <IconBadge icon={member.icon} accent={ACCENTS[index % ACCENTS.length]} />
                <h3 className={`${heading.className} text-base text-navy sm:text-lg`}>{member.name}</h3>
                <p className={`${body.className} text-sm text-slate-600`}>{member.role}</p>
              </ScrollReveal>
            ))}
          </div>

          <div className="mx-auto mt-14 grid gap-6 sm:grid-cols-2">
            {MISSION_VISION.map((block, index) => (
              <ScrollReveal
                key={block.title}
                delay={index * 120}
                className={`rounded-3xl border-t-4 bg-white p-6 text-center shadow-lg shadow-navy/5 sm:p-8 ${block.accent}`}
              >
                <h3 className={`${heading.className} tracking-tight text-2xl text-navy`}>{block.title}</h3>
                <p className={`${body.className} mt-3 text-sm text-slate-600 sm:text-base`}>{block.text}</p>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className="mt-14 text-center">
            <h3 className={`${heading.className} tracking-tight text-2xl text-navy`}>Nuestros valores</h3>
          </ScrollReveal>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((value, index) => (
              <ScrollReveal
                key={value.name}
                delay={index * 80}
                className="rounded-2xl bg-mist p-4 shadow-sm shadow-navy/5"
              >
                <h4 className={`${heading.className} text-sm text-royal sm:text-base`}>{value.name}</h4>
                <p className={`${body.className} mt-1 text-xs text-slate-600 sm:text-sm`}>{value.text}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="w-full bg-mist px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto w-full max-w-5xl">
          <ScrollReveal className="text-center">
            <Kicker color="text-sky">La solución</Kicker>
            <h2 className={`${heading.className} mt-2 tracking-tight text-3xl text-navy sm:text-4xl`}>
              ¿Cómo funciona AeroGuardia?
            </h2>
            <p className={`${body.className} mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg`}>
              AeroGuardia es un sistema integral que une hardware inteligente y software avanzado para
              profesionalizar la gestión de hangares. Mediante el uso de tarjetas RFID y una plataforma
              web centralizada, transformamos procesos manuales en una operación digital, segura y
              auditable en tiempo real.
            </p>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <ScrollReveal
                key={step.title}
                delay={index * 120}
                className="flex flex-col items-center gap-3 rounded-3xl bg-white p-6 text-center shadow-md shadow-navy/5 transition hover:-translate-y-1 hover:shadow-xl sm:p-8"
              >
                <IconBadge icon={step.icon} accent={ACCENTS[index % ACCENTS.length]} />
                <h3 className={`${heading.className} text-lg text-navy`}>{step.title}</h3>
                <p className={`${body.className} text-sm text-slate-600`}>{step.text}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Qué hacemos */}
      <section className="w-full bg-white px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto w-full max-w-5xl">
          <ScrollReveal className="text-center">
            <Kicker color="text-gold">Lo que hacemos</Kicker>
            <h2 className={`${heading.className} mt-2 tracking-tight text-3xl text-navy sm:text-4xl`}>
              ¿Qué hacemos?
            </h2>
            <p className={`${body.className} mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg`}>
              AeroGuardia es la plataforma que digitaliza el registro de tus aeronaves, automatiza la
              generación de reportes y controla, con hardware RFID propio, exactamente quién entra y
              sale de tu hangar.
            </p>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <ScrollReveal
                key={feature.title}
                delay={index * 120}
                className="flex flex-col items-center gap-3 rounded-3xl bg-mist p-6 text-center shadow-md shadow-navy/5 transition hover:-translate-y-1 hover:shadow-xl sm:p-8"
              >
                <IconBadge icon={feature.icon} accent={ACCENTS[index % ACCENTS.length]} />
                <h3 className={`${heading.className} text-lg text-navy`}>{feature.title}</h3>
                <p className={`${body.className} text-sm text-slate-600`}>{feature.text}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Nuestras funciones */}
      <section className="w-full bg-mist px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto w-full max-w-5xl">
          <ScrollReveal className="text-center">
            <Kicker color="text-royal">Funciones de la plataforma</Kicker>
            <h2 className={`${heading.className} mt-2 tracking-tight text-3xl text-navy sm:text-4xl`}>
              Nuestras funciones
            </h2>
            <p className={`${body.className} mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg`}>
              Lo que ya funciona hoy dentro de la plataforma, de punta a punta.
            </p>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FUNCTIONS.map((fn, index) => (
              <ScrollReveal
                key={fn.title}
                delay={index * 90}
                className="flex flex-col items-start gap-3 rounded-3xl bg-white p-6 text-left shadow-md shadow-navy/5 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <IconBadge icon={fn.icon} accent={ACCENTS[index % ACCENTS.length]} size={22} />
                <h3 className={`${heading.className} text-base text-navy sm:text-lg`}>{fn.title}</h3>
                <p className={`${body.className} text-sm text-slate-600`}>{fn.text}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Planes y precios */}
      <section className="relative w-full overflow-hidden bg-navy px-4 py-16 text-white sm:px-6 sm:py-24">
        <GradientBlobs className="opacity-60" />
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <ScrollReveal className="text-center">
            <Kicker color="text-sky">Planes y suscripciones</Kicker>
            <h2 className={`${heading.className} mt-2 tracking-tight text-3xl sm:text-4xl`}>
              Invierte en la seguridad de tu hangar
            </h2>
            <p className={`${body.className} mx-auto mt-4 max-w-2xl text-base text-slate-200 sm:text-lg`}>
              Un modelo de suscripción pensado para ser accesible y efectivo para hangares de aviación
              general.
            </p>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PRICING.map((plan, index) => (
              <ScrollReveal
                key={plan.name}
                delay={index * 120}
                className={
                  plan.featured
                    ? "relative flex flex-col items-center gap-3 rounded-3xl bg-gradient-to-b from-royal to-navy-light p-6 text-center shadow-2xl shadow-royal/40 ring-2 ring-gold sm:p-8"
                    : "flex flex-col items-center gap-3 rounded-3xl bg-white/10 p-6 text-center ring-1 ring-white/15 backdrop-blur-sm sm:p-8"
                }
              >
                {plan.featured && (
                  <span className="absolute -top-3 rounded-full bg-gold px-4 py-1 text-xs font-bold uppercase tracking-wide text-navy shadow-md">
                    Recomendado
                  </span>
                )}
                <plan.icon className={`h-11 w-11 ${plan.featured ? "text-gold" : "text-sky"}`} />
                <h3 className={`${heading.className} text-lg`}>{plan.name}</h3>
                <p className={`${heading.className} text-3xl ${plan.featured ? "text-gold" : "text-sky"}`}>
                  {plan.price}{" "}
                  <span className={`${body.className} text-base font-semibold text-slate-300`}>MXN</span>
                </p>
                <p className={`${body.className} text-sm leading-relaxed text-slate-200`}>{plan.text}</p>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className="mt-10 flex justify-center" delay={200}>
            <Link
              href="/login?mode=register"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-navy shadow-lg transition hover:scale-105 hover:shadow-xl sm:text-base"
            >
              Comenzar ahora
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Statement */}
      <section className="w-full bg-white px-4 py-16 sm:px-6 sm:py-24">
        <ScrollReveal>
          <p
            className={`${heading.className} mx-auto max-w-4xl text-center tracking-tight text-3xl leading-tight text-navy sm:text-4xl md:text-5xl`}
          >
            Seguridad y trazabilidad en cada hangar — sin depender del papel.
          </p>
        </ScrollReveal>
      </section>

      {/* Contacto */}
      <section id="contacto" className="w-full bg-mist px-4 py-16 sm:px-6 sm:py-20">
        <ScrollReveal className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center shadow-xl shadow-navy/10 sm:p-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-royal to-sky text-white shadow-lg shadow-royal/30">
            <FaEnvelope className="h-7 w-7" />
          </div>
          <h2 className={`${heading.className} text-2xl text-navy sm:text-3xl`}>Contacto</h2>
          <p className={`${body.className} text-sm text-slate-500`}>Correo electrónico de contacto</p>
          <a
            href="mailto:hernandez435627@gmail.com"
            className="text-lg font-bold text-royal underline decoration-royal/40 underline-offset-4 transition hover:text-sky"
          >
            hernandez435627@gmail.com
          </a>
          <p className={`${body.className} text-sm leading-relaxed text-slate-600`}>
            Estamos disponibles para resolver dudas, cotizaciones y proyectos de implementación.
          </p>
        </ScrollReveal>
      </section>

      <p className={`${body.className} bg-mist px-4 pb-6 text-center text-[10px] text-slate-400`}>
        Fotos: Don Ramey Logan, University of the Fraser Valley, FlugKerl2 y Peter F.A. van de Noort — Wikimedia
        Commons (CC BY-SA).
      </p>
    </div>
  );
}
