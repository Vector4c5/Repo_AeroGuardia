import Link from "next/link";
import { Montserrat, Roboto_Condensed } from "next/font/google";
import { AiFillSafetyCertificate } from "react-icons/ai";
import { FaComputer, FaBell, FaMicrochip, FaLaptopCode, FaPlaneLock } from "react-icons/fa6";
import { FaClipboardList, FaFilePdf } from "react-icons/fa";
import { MdKeyboardArrowDown } from "react-icons/md";
import ScrollReveal from "@/Components/common/ScrollReveal";

const heading = Montserrat({ weight: ["700", "800"], subsets: ["latin"] });
const body = Roboto_Condensed({ weight: ["400", "700"], subsets: ["latin"] });

const CARD_CLASS =
  "flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm";

const FEATURES = [
  {
    icon: AiFillSafetyCertificate,
    color: "text-emerald-600",
    title: "Control de accesos",
    text: "Cada persona que entra o sale del hangar queda registrada, sin depender de una bitácora en papel.",
  },
  {
    icon: FaComputer,
    color: "text-blue-800",
    title: "Monitoreo en tiempo real",
    text: "El estado de tus aeronaves y los eventos de acceso se actualizan al instante en la plataforma.",
  },
  {
    icon: FaBell,
    color: "text-red-500",
    title: "Alertas automáticas",
    text: "Te avisamos de lo que necesita tu atención, sin que tengas que ir a buscarlo.",
  },
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

const MISSION_VISION = [
  {
    title: "Misión",
    text: "Garantizar la seguridad y la trazabilidad en hangares aeronáuticos mediante soluciones tecnológicas que integren el control de accesos y la gestión digital de la información, mejorando la confiabilidad y el control operativo en la aviación general.",
  },
  {
    title: "Visión",
    text: "Ser una empresa líder en la gestión y seguridad de hangares aeronáuticos, reconocida por su confiabilidad, innovación tecnológica y enfoque en la trazabilidad, contribuyendo al desarrollo ordenado y eficiente de la infraestructura aeroportuaria.",
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

const TEAM = [
  {
    icon: FaLaptopCode,
    name: "Héctor Hernández",
    role: "Desarrollador Full Stack",
  },
  {
    icon: FaMicrochip,
    name: "Carlo Emiliano Rodríguez Carmona",
    role: "Ingeniería e Integración de Hardware",
  },
];

function CtaButton({ href, label }) {
  return (
    <Link
      href={href}
      className="w-full rounded-xl bg-slate-900 p-3 text-white shadow-md transition duration-300 hover:scale-[0.98] hover:bg-slate-800 hover:shadow-lg sm:w-8/12 md:w-7/12 lg:w-6/12 xl:w-5/12"
    >
      <p className={`${heading.className} text-center text-lg sm:text-2xl md:text-3xl lg:text-4xl`}>
        {label}
      </p>
    </Link>
  );
}

export default function WelcomeDashboard({ ctaHref = "/login" }) {
  return (
    <div className="relative z-10 w-full">
      {/* Hero */}
      <section className="flex min-h-screen w-full flex-col items-center justify-center gap-4 px-4 text-center sm:gap-6 sm:px-6">
        <img
          src="/Logo_AeroGuardia_Icon.png"
          alt="Logo AeroGuardia"
          className="h-20 w-20 rounded-full border border-slate-200 bg-white object-cover shadow-md sm:h-24 sm:w-24"
        />
        <h1
          className={`${heading.className} tracking-tight text-4xl text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl`}
        >
          Bienvenido a AeroGuardia
        </h1>
        <p className={`${body.className} max-w-xl text-base text-slate-600 sm:text-lg`}>
          Control, seguridad y confianza para tu hangar — todo desde un mismo lugar.
        </p>

        <CtaButton href={ctaHref} label="Iniciar sesión" />

        <MdKeyboardArrowDown className="mt-8 animate-bounce text-3xl text-slate-400" />
      </section>

      {/* Qué es AeroGuardia */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <ScrollReveal className="text-center">
          <h2 className={`${heading.className} tracking-tight text-3xl text-slate-900 sm:text-4xl`}>
            ¿Qué es AeroGuardia?
          </h2>
          <p className={`${body.className} mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg`}>
            AeroGuardia es la plataforma que digitaliza el registro de tus aeronaves,
            automatiza la generación de reportes y controla, con hardware RFID propio,
            exactamente quién entra y sale de tu hangar.
          </p>
        </ScrollReveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <ScrollReveal key={feature.title} delay={index * 120} className={CARD_CLASS}>
                <Icon size={36} className={feature.color} />
                <h3 className={`${heading.className} text-lg text-slate-900`}>{feature.title}</h3>
                <p className={`${body.className} text-sm text-slate-600`}>{feature.text}</p>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <ScrollReveal className="text-center">
          <h2 className={`${heading.className} tracking-tight text-3xl text-slate-900 sm:text-4xl`}>
            ¿Cómo funciona?
          </h2>
        </ScrollReveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <ScrollReveal key={step.title} delay={index * 120} className={CARD_CLASS}>
                <Icon size={32} className="text-blue-800" />
                <h3 className={`${heading.className} text-lg text-slate-900`}>{step.title}</h3>
                <p className={`${body.className} text-sm text-slate-600`}>{step.text}</p>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-6 sm:grid-cols-2">
          {MISSION_VISION.map((block, index) => (
            <ScrollReveal
              key={block.title}
              delay={index * 120}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8"
            >
              <h3 className={`${heading.className} tracking-tight text-2xl text-blue-800`}>
                {block.title}
              </h3>
              <p className={`${body.className} mt-3 text-sm text-slate-600 sm:text-base`}>
                {block.text}
              </p>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="mt-10 text-center">
          <h3 className={`${heading.className} tracking-tight text-2xl text-slate-900`}>
            Nuestros valores
          </h3>
        </ScrollReveal>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((value, index) => (
            <ScrollReveal
              key={value.name}
              delay={index * 80}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h4 className={`${heading.className} text-sm text-blue-800 sm:text-base`}>{value.name}</h4>
              <p className={`${body.className} mt-1 text-xs text-slate-600 sm:text-sm`}>{value.text}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Quiénes somos */}
      <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <ScrollReveal className="text-center">
          <h2 className={`${heading.className} tracking-tight text-3xl text-slate-900 sm:text-4xl`}>
            ¿Quiénes somos?
          </h2>
          <p className={`${body.className} mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg`}>
            Un proyecto nacido en la Universidad Politécnica de Chihuahua, hoy convertido
            en un prototipo funcional de control de acceso y gestión de hangares.
          </p>
        </ScrollReveal>

        <div className="mx-auto mt-10 grid max-w-2xl gap-6 sm:grid-cols-2">
          {TEAM.map((member, index) => {
            const Icon = member.icon;
            return (
              <ScrollReveal key={member.name} delay={index * 150} className={CARD_CLASS}>
                <Icon size={32} className="text-blue-800" />
                <h3 className={`${heading.className} text-base text-slate-900 sm:text-lg`}>
                  {member.name}
                </h3>
                <p className={`${body.className} text-sm text-slate-600`}>{member.role}</p>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* CTA final */}
      <section className="flex w-full flex-col items-center justify-center gap-4 px-4 py-16 pb-24 text-center sm:px-6">
        <ScrollReveal className="flex flex-col items-center gap-4">
          <h2 className={`${heading.className} tracking-tight text-2xl text-slate-900 sm:text-3xl`}>
            ¿Listo para empezar?
          </h2>
          <CtaButton href={ctaHref} label="Iniciar sesión" />
        </ScrollReveal>
      </section>
    </div>
  );
}
