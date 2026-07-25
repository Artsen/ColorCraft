import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/tokens.css'
import './styles/reset.css'
import './styles/foundations.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/features.css'
import './styles/responsive.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

