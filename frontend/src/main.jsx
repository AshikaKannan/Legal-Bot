import React from 'react'
import ReactDOM from 'react-dom/client'
import { useState, useEffect } from 'react'; 
import './index.css'
import App from './App.jsx'


function Main() {
  // Default theme is light
  const [theme, setTheme] = useState('light');

  // On mount, read saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
  }, []);

  // Update the document's data-theme attribute and localStorage whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Toggle between "light" and "dark" themes
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };
  return (
    <>
      {/* Theme toggle button using sun and moon emojis */}
      <button className="theme-toggle-btn" onClick={toggleTheme}>
        {theme === 'light' ? "☀" : "🌙"}
      </button>
      <App />
    </>
  );
}


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>,
)
