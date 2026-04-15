import { useEffect, useState } from "react";

export default function Emergencia() {

  const [eventos, setEventos] = useState([]);

  const cargar = async () => {
    const res = await fetch("/api/acceso");
    const data = await res.json();

    const filtrados = data.eventos.filter(e => e.estado === "DENEGADO");
    setEventos(filtrados);
  };

  useEffect(() => {
    cargar();
    const i = setInterval(cargar, 1500);
    return () => clearInterval(i);
  }, []);

  return (
    <div style={{ background: "#1a0000", color: "white", minHeight: "100vh", padding: 20 }}>

      <a href="/inicio">⬅ Volver</a>

      <h1>🚨 Emergencias</h1>

      {eventos.map((e, i) => (
        <div key={i} style={{ color: "red" }}>
          {e.nombre} - {e.hora}
        </div>
      ))}

    </div>
  );
}