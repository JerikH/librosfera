import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { HelmetProvider } from 'react-helmet-async';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

// Enviar Core Web Vitals a GA4
const sendToGA4 = ({ name, delta, id }) => {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, {
    value: Math.round(name === 'CLS' ? delta * 1000 : delta),
    event_category: 'Web Vitals',
    event_label: id,
    non_interaction: true,
  });
};

reportWebVitals(sendToGA4);
