import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Polices hébergées sur le site (licence SIL OFL 1.1) : aucune requête vers Google Fonts
import '@fontsource/cardo/400.css'
import '@fontsource/cardo/400-italic.css'
import '@fontsource/cardo/700.css'
import '@fontsource/archivo/400.css'
import '@fontsource/archivo/500.css'
import '@fontsource/archivo/600.css'
import '@fontsource/amiri/400.css'
import '@fontsource/amiri/700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
