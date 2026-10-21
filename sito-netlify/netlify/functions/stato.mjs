import { getStore, getDeployStore } from "@netlify/blobs";

const REPERTI = ["giornale", "copione", "assegno", "mail", "telefono", "rullino"];
const DEFAULT = { visible: REPERTI };

function store() {
  const opts = { name: "cena-con-delitto", consistency: "strong" };
  return Netlify.context?.deploy?.context === "production" ? getStore(opts) : getDeployStore(opts);
}

export default async (req) => {
  const s = store();
  const noCache = { "cache-control": "no-store" };

  if (req.method === "GET") {
    const stato = (await s.get("stato", { type: "json" })) || DEFAULT;
    return Response.json(stato, { headers: noCache });
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return new Response("JSON non valido", { status: 400 }); }
    const codice = Netlify.env.get("ADMIN_CODE") || "6104";
    if (!body || String(body.code) !== codice) return new Response("Codice errato", { status: 403 });
    if (!Array.isArray(body.visible)) return new Response("Dati non validi", { status: 400 });
    const visible = REPERTI.filter((id) => body.visible.includes(id));
    const stato = { visible, t: Date.now() };
    await s.setJSON("stato", stato);
    return Response.json(stato, { headers: noCache });
  }

  return new Response("Metodo non consentito", { status: 405 });
};

export const config = { path: "/api/stato" };
