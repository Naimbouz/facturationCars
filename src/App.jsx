import React, { useState, useEffect } from 'react';
import InvoiceForm from './components/InvoiceForm';
import InvoiceSummary from './components/InvoiceSummary';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [formData, setFormData] = useState({
    clientName: '',
    registration: '',
    car: '',
    service: '',
    quantity: 1,
    unitPrice: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="invoice-container">
      <header className="header">
        <div className="company-info">
          <h1>AutoService Pro</h1>
          <p>123 Avenue de la Mécanique</p>
          <p>75000 Paris</p>
          <p>Tel: 01 23 45 67 89</p>
        </div>
        <div className="date-section">
          <p>Date de facturation</p>
          <p>{formatDate(currentDate)}</p>
        </div>
      </header>

      <main>
        <InvoiceForm data={formData} onChange={handleInputChange} />
        <InvoiceSummary data={formData} />
        <button className="btn" onClick={() => window.print()}>
          Imprimer la facture
        </button>
      </main>
    </div>
  );
}

export default App;
