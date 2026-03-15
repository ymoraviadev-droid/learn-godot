import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initializeTheme } from "@/lib/theme";
import App from "./App";
import "./index.css";

initializeTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
