import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import InvoiceManagement from './pages/InvoiceManagement.jsx';
import ElementManagement from './pages/ElementManagement.jsx';
import { CurrencyProvider } from './contexts/CurrencyContext.jsx';
import { ElementsProvider } from './contexts/ElementsContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CurrencyProvider>
      <ElementsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/invoices" element={<InvoiceManagement />} />
            <Route path="/elements" element={<ElementManagement />} />
          </Routes>
        </BrowserRouter>
      </ElementsProvider>
    </CurrencyProvider>
  </StrictMode>
);
