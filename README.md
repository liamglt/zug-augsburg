# Zug Augsburg 🚆

A small home-screen web app with live train departures for the commute between Munich and Augsburg.

- **Hinfahrt:** regional trains to Augsburg from **München Hbf** (RE9, RE/RB 86, RE/RB 87, RE80, RE89). The top card shows today's train based on your first lecture (trains leaving 80–40 min before).
- **Rückfahrt:** every regional train from **Augsburg Bahnhof Haunstetterstraße** towards München. The top card shows the first train leaving after your last lecture ends.
- The app switches to Rückfahrt automatically once your first lecture has started; you can also switch by hand.
- If your train is delayed or cancelled, the top card tells you which one to take instead.
- Lecture start and end times are entered via ⚙︎ and stored **only on your phone** (browser storage). Nothing personal is in this repo.
- Refreshes every minute and whenever the app is opened.
- Data: MVV timetable server (EFA, the one behind the MVV app), which includes DB regional trains.

## Install on iPhone

Open the page in **Safari** → Share button → **Add to Home Screen**.

## Hosting

GitHub Pages: Settings → Pages → Source "Deploy from a branch" → `main` / `(root)`.

## Relay (needed for live data)

The MVV server doesn't let websites load its data directly (CORS), so the app goes through a small Cloudflare Worker: `relay/worker.js`. It only forwards departure requests for München Hbf and Augsburg Bahnhof Haunstetterstraße, and only for this site.

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Create Worker** → name it e.g. `zug-relay` → **Deploy**.
2. **Edit code** → replace everything with `relay/worker.js` → **Deploy**.
3. Put the worker's address (e.g. `https://zug-relay.<name>.workers.dev`) into `const RELAY = "..."` in `index.html`.
