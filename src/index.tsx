import { ChakraProvider } from '@chakra-ui/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './components/App'

const docRoot = document.getElementById('root')
if (!docRoot) throw new Error('Root element not found')

const root = ReactDOM.createRoot(docRoot)
root.render(
  <React.StrictMode>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </React.StrictMode>
)
