import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        <filter id="glass-distortion">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.003"
            numOctaves="3"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
    <App />
  </StrictMode>,
)
