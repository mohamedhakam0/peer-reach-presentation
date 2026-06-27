import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

try {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light-mode');
    document.body.classList.add('light-mode');
  }
} catch {
  // Ignore storage errors and fall back to dark mode.
}

if (!window.location.hash) {
  window.location.hash = '#/intro';
}

createRoot(document.getElementById("root")!).render(<App />);
