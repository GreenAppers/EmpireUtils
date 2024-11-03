import { ChakraProvider } from '@chakra-ui/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './components/App'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const docRoot = document.getElementById('root')
if (!docRoot) throw new Error('Root element not found')

const queryClient = new QueryClient()
const root = ReactDOM.createRoot(docRoot)

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        <App />
      </ChakraProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
