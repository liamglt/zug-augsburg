// Cloudflare Worker: relays MVV departure data to the Zug Augsburg web app.
// The MVV server doesn't allow websites to load its data directly (CORS), so this adds
// the permission header. It only forwards departure requests for the two stations the app uses.
//
// Deploy: Cloudflare dashboard -> Workers & Pages -> Create -> Worker -> paste this -> Deploy.

const EFA = "https://efa.mvv-muenchen.de/ng/XML_DM_REQUEST";
const STOPS = new Set(["de:09162:100", "de:09761:111"]);   // München Hbf, Augsburg Bahnhof Haunstetterstraße
const ALLOWED_ORIGINS = ["https://liamglt.github.io"];

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Vary": "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const stop = new URL(request.url).searchParams.get("stop");
    if (!STOPS.has(stop)) return new Response("unknown stop", { status: 400, headers: cors });

    const q = new URLSearchParams({ outputFormat: "rapidJSON", type_dm: "stop", name_dm: stop, mode: "direct",
                                    useRealtime: "1", limit: "150" });
    const upstream = await fetch(`${EFA}?${q}`, { headers: { "User-Agent": "zug-augsburg-relay/1.0" },
                                                 cf: { cacheTtl: 30, cacheEverything: true } });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=30" },
    });
  },
};
