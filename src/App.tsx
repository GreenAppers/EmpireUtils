import React, { useEffect, useState } from 'react'

function App() {
  const [corners, setCorners] = useState([])
  useEffect(() => {
    window.api.onClipboardTextUpdated((text: string) => {
      const match = text.match(/X: (-?\d+) Y: (-?\d+) Z: (-?\d+)/)
      if (!match) return

      const x = parseInt(match[1])
      const y = parseInt(match[2])
      const z = parseInt(match[3])

      const corner = `${x}, ${y}, ${z}`
      setCorners((corners) => [...corners, corner])
    })
    return () => window.api.removeClipboardTextUpdatedListener()
  }, [])

  return (
    <div>
      <h1>🥧📡 Anti/PieRay Helper</h1>
      <p>Corners:</p>
      <>
        {corners.map((x) => (
          <p>{x}</p>
        ))}
      </>
    </div>
  )
}

export default App
