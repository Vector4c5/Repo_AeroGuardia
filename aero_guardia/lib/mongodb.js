import dns from "dns";
import mongoose from "mongoose";

// Windows often fails Node SRV lookups (querySrv ECONNREFUSED).
// Prefer public DNS so mongodb+srv:// also works when used.
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  /* ignore if not allowed in this environment */
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Define la variable MONGODB_URI en .env.local");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: "aeroguardia",
    });
  }

  cached.conn = await cached.promise;

  console.log("MongoDB conectado (aeroguardia)");

  return cached.conn;
}

export default connectDB;
