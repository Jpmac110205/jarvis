import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GoogleConnectionProvider } from "./contexts/GoogleConnectionProvider";
import { GoogleDataProvider } from './contexts/GoogleDataProvider.tsx';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleDataProvider>
      <GoogleConnectionProvider>
        <App />
      </GoogleConnectionProvider>
    </GoogleDataProvider>
  </StrictMode>
);