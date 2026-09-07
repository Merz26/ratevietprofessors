import React, { createContext, useContext, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import '@figma/astraui/styles.css'
import './index.css'

type AppTheme = 'light' | 'dark' | 'system'

interface ThemeCtx {
  theme: AppTheme
  setTheme: (t: AppTheme) => void
  resolvedTheme: 'light' | 'dark'
}

export const ThemeContext = createContext<ThemeCtx>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'dark',
})

export const useAppTheme = () => useContext(ThemeContext)

const getInitialTheme = (): AppTheme => {
  try {
    const stored = localStorage.getItem('astra-theme')
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored as AppTheme
  } catch { /* ignore */ }
  // On first visit with no stored setting, default to 'system'
  return 'system'
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}

const getInitialResolvedTheme = (pref: AppTheme): 'light' | 'dark' => {
  if (pref === 'system') return getSystemTheme()
  return pref
}

function Root() {
  const [theme, setThemeState] = useState<AppTheme>(getInitialTheme)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    return getInitialResolvedTheme(getInitialTheme())
  })

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const updateResolved = () => {
      if (theme === 'system') {
        setResolvedTheme(media.matches ? 'dark' : 'light')
      } else {
        setResolvedTheme(theme)
      }
    }
    updateResolved()
    
    // Listen for live system theme changes when user has chosen 'system'
    media.addEventListener('change', updateResolved)
    return () => media.removeEventListener('change', updateResolved)
  }, [theme])

  const setTheme = (t: AppTheme) => {
    setThemeState(t)
    try { 
      localStorage.setItem('astra-theme', t) 
    } catch { /* ignore */ }
  }

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
    root.setAttribute('data-theme', resolvedTheme)
    if (document.body) {
      document.body.classList.remove('light', 'dark')
      document.body.classList.add(resolvedTheme)
      document.body.setAttribute('data-theme', resolvedTheme)
    }
    try {
      localStorage.setItem('astra-theme', theme)
    } catch { /* ignore */ }
  }, [resolvedTheme, theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeContext.Provider>
  )
}

const w = window as Window & { __appRoot?: ReactDOM.Root; __appRootEl?: HTMLElement }
const container = document.getElementById('root')!

if (!w.__appRoot || w.__appRootEl !== container) {
  w.__appRoot = ReactDOM.createRoot(container)
  w.__appRootEl = container
}

// StrictMode's deliberate double-mount triggers AstraUI ThemeProvider's direct
// classList DOM writes twice, desynchronising React's fiber tree from the real
// DOM and producing the removeChild crash. Omit StrictMode in this project.
w.__appRoot.render(<Root />)
