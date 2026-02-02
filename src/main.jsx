import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'

// When built with VITE_BASE_PATH (e.g. /controlcentre/), React Router needs the same basename
const basePath = import.meta.env.VITE_BASE_PATH
const basename = typeof basePath === 'string' && basePath !== './'
  ? basePath.replace(/\/+$/, '') // strip trailing slash
  : undefined

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
