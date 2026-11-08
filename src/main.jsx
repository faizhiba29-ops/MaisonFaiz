import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Polices hébergées sur le site (licence SIL OFL 1.1) : aucune requête vers Google Fonts.
// Uniquement les alphabets utilisés : latin (+ accents étendus) et arabe pour Amiri.
import '@fontsource/cardo/latin-400.css'
import '@fontsource/cardo/latin-ext-400.css'
import '@fontsource/cardo/latin-400-italic.css'
import '@fontsource/cardo/latin-ext-400-italic.css'
import '@fontsource/cardo/latin-700.css'
import '@fontsource/cardo/latin-ext-700.css'
import '@fontsource/archivo/latin-400.css'
import '@fontsource/archivo/latin-ext-400.css'
import '@fontsource/archivo/latin-500.css'
import '@fontsource/archivo/latin-ext-500.css'
import '@fontsource/archivo/latin-600.css'
import '@fontsource/archivo/latin-ext-600.css'
import '@fontsource/amiri/arabic-400.css'
import '@fontsource/amiri/arabic-700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
