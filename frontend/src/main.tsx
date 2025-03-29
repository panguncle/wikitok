import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { LikedArticlesProvider } from './contexts/LikedArticlesContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './i18n'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <LikedArticlesProvider>
        <App />
      </LikedArticlesProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
