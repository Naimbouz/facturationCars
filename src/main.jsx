import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import InvoiceManagement from './pages/InvoiceManagement.jsx';
import { CurrencyProvider } from './contexts/CurrencyContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CurrencyProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/invoices" element={<InvoiceManagement />} />
        </Routes>
      </BrowserRouter>
    </CurrencyProvider>
  </StrictMode>
);
