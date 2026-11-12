// Cloudflare Worker: relays MVV departure data to the Zug Augsburg web app.
// The MVV server doesn't allow websites to load its data directly (CORS), so this adds
// the permission header. It only forwards a few fixed kinds of requests:
//   ?stop=<id>[&date=YYYYMMDD&time=HHMM]   departures at München Hbf (trains or U-Bahn) or Haunstetterstraße
//   ?trip=home[&date=YYYYMMDD&time=HHMM]   journeys Augsburg Haunstetterstraße -> München Hbf (slimmed down)
//   ?trip=u2[&date=YYYYMMDD&time=HHMM]     journeys Theresienstraße -> Feldmoching (Liam's Heimweg app, U2 travel times)
//
// Deploy: Cloudflare dashboard -> Workers & Pages -> zug-relay -> Edit code -> paste this -> Deploy.

const EFA = "https://efa.mvv-muenchen.de/ng";
const STOPS = new Set([
  "de:09162:100",   // München Hbf (trains)
  "de:09162:6",     // München Hauptbahnhof (U-Bahn, tram) - for the U2 home
  "de:09761:111",   // Augsburg Bahnhof Haunstetterstraße
  "de:09162:120",   // München Theresienstraße (U2) - Liam's Heimweg
  "de:09162:320",   // München Feldmoching (S1, U2, bus) - Liam's Heimweg
]);
const TRIPS = {
  home: { from: "de:09761:111", to: "de:09162:100", n: "6" },
  u2:   { from: "de:09162:120", to: "de:09162:320", n: "8" },
};
const ALLOWED_ORIGINS = ["https://liamglt.github.io"];

// keep only what the app needs from a journey (the full answer is ~140 KB)
function slimTrips(data) {
  return {
    journeys: (data.journeys || []).map((j) => ({
      legs: (j.legs || []).map((l) => {
        const t = l.transportation || {}, o = l.origin || {}, d = l.destination || {};
        return {
          number: t.number || t.disassembledName || "", productClass: t.product && t.product.class,
          cancelled: !!l.isCancelled,
          from: o.name, departurePlanned: o.departureTimePlanned, departureEstimated: o.departureTimeEstimated,
          to: d.name, arrivalPlanned: d.arrivalTimePlanned, arrivalEstimated: d.arrivalTimeEstimated,
          arrivalPlatform: (d.properties && (d.properties.platformName || d.properties.platform)) || "",
        };
      }),
    })),
  };
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Vary": "Origin",
    };
    const reply = (body, status = 200) => new Response(body, { status,
      headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=30" } });
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const params = new URL(request.url).searchParams;
    const stop = params.get("stop"), trip = TRIPS[params.get("trip")];
    if (!STOPS.has(stop) && !trip) return new Response("unknown stop", { status: 400, headers: cors });

    // optional "from": date=YYYYMMDD, time=HHMM (Berlin time)
    const date = params.get("date"), time = params.get("time");
    if ((date || time) && (!/^\d{8}$/.test(date || "") || !/^\d{4}$/.test(time || "")))
      return new Response("bad date/time", { status: 400, headers: cors });
    const when = date ? { itdDate: date, itdTime: time } : {};
    const opts = { headers: { "User-Agent": "zug-augsburg-relay/1.0" }, cf: { cacheTtl: 30, cacheEverything: true } };

    if (trip) {
      const q = new URLSearchParams({ outputFormat: "rapidJSON", type_origin: "any", name_origin: trip.from,
        type_destination: "any", name_destination: trip.to, useRealtime: "1", calcNumberOfTrips: trip.n,
        itdTripDateTimeDepArr: "dep", ...when });
      const r = await fetch(`${EFA}/XML_TRIP_REQUEST2?${q}`, opts);
      if (!r.ok) return reply(JSON.stringify({ error: r.status }), r.status);
      return reply(JSON.stringify(slimTrips(await r.json())));
    }

    const q = new URLSearchParams({ outputFormat: "rapidJSON", type_dm: "stop", name_dm: stop, mode: "direct",
                                    useRealtime: "1", limit: "150", ...when });
    const upstream = await fetch(`${EFA}/XML_DM_REQUEST?${q}`, opts);
    return reply(upstream.body, upstream.status);
  },
};
