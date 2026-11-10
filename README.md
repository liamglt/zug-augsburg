# Zug Augsburg 🚆

A small home-screen web app with live train departures for the commute between Munich and Augsburg.

- **Hinfahrt:** RE9 and line 86/87 (RE or RB) from **München Hbf**. The top card shows today's train based on your first lecture (trains leaving 80–40 min before).
- **Rückfahrt:** every regional train from **Augsburg Haunstetter Straße** towards München. The top card shows the first train leaving at least 20 min after your last lecture ends.
- The app switches to Rückfahrt automatically once your first lecture has started; you can also switch by hand.
- If your train is delayed or cancelled, the top card tells you which one to take instead.
- Lecture start and end times are entered via ⚙︎ and stored **only on your phone** (browser storage). Nothing personal is in this repo.
- Refreshes every minute and whenever the app is opened.
- Data: MVG departures API, with DB (transport.rest) as a fallback (MVG also covers Augsburg Bahnhof Haunstetterstraße).

## Install on iPhone

Open the page in **Safari** → Share button → **Add to Home Screen**.

## Hosting

GitHub Pages: Settings → Pages → Source "Deploy from a branch" → `main` / `(root)`.
