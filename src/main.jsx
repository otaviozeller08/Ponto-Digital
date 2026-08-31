import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './app/App'

import './styles/reset.css'
import './styles/variables.css'
import './styles/forms.css'
import './styles/buttons.css'
import './styles/global.css'
import './styles/responsive.css'

createRoot(
  document.getElementById('root')
).render(
  <StrictMode>
    <App />
  </StrictMode>
)