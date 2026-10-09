# Tennessee FY27 Annual Bookings dashboard

Dark-theme web dashboard for Steve Jones’ Bookings 360 MBR extract.

Sums **Annual Bookings** and filters by **Sales Agent Name**. Drop a new `.xlsx` on the page to refresh — parsed in this browser only, kept in the tab session, never sent to a server or third-party API.

## Live URL

Static site is published on the `gh-pages` branch.

https://jonescrusher13.github.io/desktop-tutorial/

If that 404s, enable Pages once: repo **Settings → Pages → Deploy from a branch → `gh-pages` / root**.

## Run locally

```bash
npm install
npm start
```

Open http://localhost:5173

## Other commands

```bash
npm test
npm run build
```
