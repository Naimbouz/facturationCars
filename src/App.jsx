import React, { useState, useEffect } from 'react';
import InvoiceForm from './components/InvoiceForm';
import InvoiceSummary from './components/InvoiceSummary';
import TopNav from './components/TopNav';
import { useCurrency } from './contexts/CurrencyContext';

function App() {
  const { symbol, rate } = useCurrency();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [invoices, setInvoices] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    registration: '',
    car: '',
    serviceLines: [
      {
        service: '',
        quantity: 1,
        unitPrice: 0
      }
    ]
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsFetching(true);
    try {
      const response = await fetch('http://localhost:4000/api/invoices');
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddLine = () => {
    setFormData(prev => ({
      ...prev,
      serviceLines: [
        ...prev.serviceLines,
        {
          service: '',
          quantity: 1,
          unitPrice: 0
        }
      ]
    }));
  };

  const handleRemoveLine = (index) => {
    setFormData(prev => ({
      ...prev,
      serviceLines: prev.serviceLines.filter((_, i) => i !== index)
    }));
  };

  const handleSaveInvoice = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        serviceLines: formData.serviceLines.map(line => ({
          ...line,
          quantity: Number(line.quantity) || 0,
          unitPrice: Number(line.unitPrice) || 0
        }))
      };

      const response = await fetch('http://localhost:4000/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to save invoice');
      }

      await fetchInvoices();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintInvoice = async () => {
    // Ensure invoice is persisted before printing
    const saved = await handleSaveInvoice();
    if (saved) {
      window.print();
    } else {
      alert("Impossible d'enregistrer la facture avant impression.");
    }
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

  const formatCurrency = (amount) => `${(amount * rate).toFixed(2)} ${symbol}`;

  return (
    <>
      <TopNav />
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
        <InvoiceForm
          data={formData}
          onChange={handleInputChange}
          onAddLine={handleAddLine}
          onRemoveLine={handleRemoveLine}
        />
        <InvoiceSummary data={formData} />
        <div className="button-row">
          <button className="btn" onClick={handlePrintInvoice} disabled={isSaving}>
            {isSaving ? 'Veuillez patienter...' : 'Imprimer la facture'}
          </button>
        </div>

        <section className="saved-invoices">
          <h2>Dernières factures</h2>
          {isFetching ? (
            <p>Chargement...</p>
          ) : invoices.length === 0 ? (
            <p>Aucune facture enregistrée pour le moment.</p>
          ) : (
            <ul>
              {invoices.slice(0, 3).map(invoice => (
                <li key={invoice.id}>
                  <strong>{invoice.clientName}</strong> — {invoice.registration || 'N/A'} —{' '}
                  {invoice.car || 'N/A'}
                  {invoice.serviceLines?.length > 0 && (
                    <ul>
                      {invoice.serviceLines.map((line, idx) => (
                        <li key={idx}>
                          {line.service || 'Service'} - Qté: {line.quantity} - PU:{' '}
                          {formatCurrency(Number(line.unitPrice) || 0)}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      </div>
    </>
  );
}

export default App;
