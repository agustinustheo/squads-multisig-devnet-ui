import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Import polyfills FIRST before anything else
import "./polyfills";

createRoot(document.getElementById("root")!).render(<App />);
