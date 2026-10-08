import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { parseAndWrite } from "./scripts/parse-workbook.mjs";

function workbookPlugin() {
  return {
    name: "parse-workbook",
    buildStart() {
      parseAndWrite();
    },
  };
}

export default defineConfig({
  plugins: [workbookPlugin(), react()],
  server: {
    host: true,
    port: 5173,
  },
});
