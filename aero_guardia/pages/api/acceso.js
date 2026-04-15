global.eventos = global.eventos || [];
global.dentro = global.dentro || {};

export default function handler(req, res) {

  if (req.method === "POST") {

    const { uid, estado, nombre } = req.body;

    if (estado === "AUTORIZADO") {

      let tipo = "ENTRADA";

      if (global.dentro[uid]) {
        tipo = "SALIDA";
        global.dentro[uid] = false;
      } else {
        global.dentro[uid] = true;
      }

      global.eventos.unshift({
        nombre,
        hora: new Date().toLocaleTimeString(),
        estado,
        tipo
      });

    } else {

      global.eventos.unshift({
        nombre: "DESCONOCIDO",
        hora: new Date().toLocaleTimeString(),
        estado: "DENEGADO",
        tipo: "ERROR"
      });
    }

    return res.status(200).send("OK");
  }

  if (req.method === "GET") {
    return res.status(200).json({
      eventos: global.eventos
    });
  }
}