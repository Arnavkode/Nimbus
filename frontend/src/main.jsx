import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from './ThemeContext.jsx';
import App from './App.jsx' // This is your Login page
import Dashboard from './dashboard.jsx' // Your new dashboard page
import './index.css'

// 1. Define your "routes" (your pages)
const router = createBrowserRouter([
  {
    path: "/", // The main URL will be your login page
    element: <App />,
  },
  {
    path: "/dashboard", // The /dashboard URL will show the dashboard
    element: <Dashboard />,
  },
]);

// 2. Tell React to use the router with ThemeProvider
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
)