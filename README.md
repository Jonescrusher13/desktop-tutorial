# Tennessee FY27 Annual Bookings dashboard

Dark-theme web dashboard for Steve Jones’ Bookings 360 MBR extract.

Sums **Annual Bookings** and filters by **Sales Agent Name**. Two slots (FY26 and FY27) take MBR 360 `.xlsx` files; a year filter shows that year’s numbers only. Parsed in this browser, kept per year in the tab session, never sent to a server.

## Live URL

https://jonescrusher13.github.io/desktop-tutorial/

Drop FY26 and FY27 MBR `.xlsx` files into the two slots. Cisco workbooks are not in this repo or on the published site — parse stays in the browser.

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
