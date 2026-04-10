import { useEffect, useState } from "react";

export default function ControlAcceso() {

  const [eventos, setEventos] = useState([]);

  const cargar = async () => {
    const res = await fetch("/api/acceso");
    const data = await res.json();

    const filtrados = data.eventos.filter(e => e.estado === "AUTORIZADO");
    setEventos(filtrados);
  };

  useEffect(() => {
    cargar();
    const i = setInterval(cargar, 1500);
    return () => clearInterval(i);
  }, []);

  return (
    <div style={{ background: "#0b1a2a", color: "white", minHeight: "100vh", padding: 20 }}>

      <a href="/inicio">🏠 Inicio</a>
      <a href="/emergencia" style={{ marginLeft: 20 }}>🚨 Emergencia</a>

      <h1>Control de Acceso</h1>

      <table border="1" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Hora</th>
            <th>Tipo</th>
          </tr>
        </thead>

        <tbody>
          {eventos.map((e, i) => (
            <tr key={i}>
              <td>{e.nombre}</td>
              <td>{e.hora}</td>
              <td style={{
                color: e.tipo === "ENTRADA" ? "cyan" : "orange"
              }}>
                {e.tipo}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}