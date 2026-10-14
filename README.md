# Tennessee FY27 Annual Bookings dashboard

Dark-theme web dashboard for Steve Jones’ Bookings 360 MBR extract.

Sums **Annual Bookings** and filters by **Sales Agent Name**. Two slots (FY26 and FY27) take MBR 360 `.xlsx` files; a year filter shows that year’s numbers only. Parsed in this browser, kept per year in the tab session, never sent to a server.

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
