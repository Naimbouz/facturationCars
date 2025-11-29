import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TopNav from '../components/TopNav';
import InvoiceForm from '../components/InvoiceForm';
import InvoiceFilterBar from '../components/InvoiceFilterBar';
import InvoiceFooter from '../components/InvoiceFooter';
import * as XLSX from 'xlsx';
import { useCurrency } from '../contexts/CurrencyContext';

const InvoiceManagement = () => {
  const { symbol, rate } = useCurrency();
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filters, setFilters] = useState({
    clientName: '',
    car: '',
    dateFrom: null,
    dateTo: null
  });

  const fetchInvoices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:4000/api/invoices');
      if (!response.ok) {
        throw new Error('Impossible de récupérer les factures');
      }
      const data = await response.json();
      setInvoices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const formatCurrency = (amount) => `${(amount * rate).toFixed(2)} ${symbol}`;

  const computeEditFormTotal = () => {
    if (!editForm) return 0;
    const subtotal = editForm.serviceLines?.reduce((sum, line) => {
      const quantity = Number(line.quantity) || 0;
      const unitPrice = Number(line.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0) || 0;
    const tvaRate = 0.2;
    const timbreFiscal = 1;
    return (subtotal + subtotal * tvaRate + timbreFiscal) * rate;
  };

  const getFilteredInvoices = () => {
    return invoices.filter((invoice) => {
      // Filter by client name
      if (filters.clientName) {
        const name = (invoice.clientName || '').toLowerCase();
        if (!name.includes(filters.clientName.toLowerCase())) {
          return false;
        }
      }
      // Filter by car
      if (filters.car) {
        const carName = (invoice.car || '').toLowerCase();
        if (!carName.includes(filters.car.toLowerCase())) {
          return false;
        }
      }
      // Filter by date range
      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        const invDate = new Date(invoice.createdAt);
        if (invDate < from) {
          return false;
        }
      }
      if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59, 999);
        const invDate = new Date(invoice.createdAt);
        if (invDate > to) {
          return false;
        }
      }
      return true;
    });
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const computeTotals = (invoice) => {
    const subtotal = invoice.serviceLines?.reduce((sum, line) => {
      const quantity = Number(line.quantity) || 0;
      const unitPrice = Number(line.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0) || 0;
    const tvaRate = 0.2;
    const timbreFiscal = 1;
    const total = subtotal + subtotal * tvaRate + timbreFiscal;
    return { subtotal, total };
  };

  const startEditing = (invoice) => {
    setSelectedInvoice(invoice);
    setEditForm({
      clientName: invoice.clientName || '',
      registration: invoice.registration || '',
      car: invoice.car || '',
      serviceLines: invoice.serviceLines?.length
        ? invoice.serviceLines.map((line) => ({
            service: line.service || '',
            quantity: Number(line.quantity) || 1,
            unitPrice: Number(line.unitPrice) || 0
          }))
        : [
            {
              service: '',
              quantity: 1,
              unitPrice: 0
            }
          ]
    });
  };

  const handleEditInputChange = (name, value) => {
    setEditForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEditLine = () => {
    setEditForm((prev) => ({
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

  const handleRemoveEditLine = (index) => {
    setEditForm((prev) => ({
      ...prev,
      serviceLines: prev.serviceLines.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateInvoice = async () => {
    if (!selectedInvoice) return;
    setIsUpdating(true);
    try {
      const payload = {
        ...editForm,
        serviceLines: editForm.serviceLines.map((line) => ({
          ...line,
          quantity: Number(line.quantity) || 0,
          unitPrice: Number(line.unitPrice) || 0
        }))
      };
      const response = await fetch(`http://localhost:4000/api/invoices/${selectedInvoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('Impossible de mettre à jour la facture');
      }
      await fetchInvoices();
      setSelectedInvoice(null);
      setEditForm(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Supprimer cette facture ?')) {
      return;
    }
    setDeletingId(invoiceId);
    try {
      const response = await fetch(`http://localhost:4000/api/invoices/${invoiceId}`, {
        method: 'DELETE'
      });
      if (!response.ok && response.status !== 204) {
        if (response.status === 404) {
          // Already removed on server; refresh list locally
          await fetchInvoices();
          return;
        }
        throw new Error('Impossible de supprimer la facture');
      }
      await fetchInvoices();
      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice(null);
        setEditForm(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportXLSX = () => {
    try {
      const rows = invoices.map((inv) => {
        const totals = computeTotals(inv);
        const servicesText = (inv.serviceLines || [])
          .map(l => `${l.service || ''} x${l.quantity || 0} @${l.unitPrice || 0}`)
          .join(' ; ');

        return {
          ID: inv.id,
          Client: inv.clientName || '',
          Immatriculation: inv.registration || '',
          Vehicule: inv.car || '',
          Date: inv.createdAt ? new Date(inv.createdAt).toLocaleString('fr-FR') : '',
          Total_TTC: formatCurrency(totals.total),
          Services: servicesText
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Factures');
      XLSX.writeFile(wb, 'factures.xlsx');
    } catch (err) {
      console.error('Export XLSX failed', err);
      alert('Erreur lors de l\'export XLSX. Voir la console.');
    }
  };

  return (
    <>
      <TopNav />
      <div className="management-container">
        <header className="management-header">
          <div>
            <h1>Gestion des factures</h1>
            <p>Consultez et suivez toutes les factures enregistrées</p>
          </div>
          <div className="management-actions">
            <Link className="btn secondary" to="/">
              Nouvelle facture
            </Link>
            <button className="btn" type="button" onClick={fetchInvoices} disabled={isLoading}>
              {isLoading ? 'Actualisation...' : 'Actualiser'}
            </button>
            <button className="btn" type="button" onClick={() => handleExportXLSX()}>
              Exporter XLSX
            </button>
          </div>
        </header>

        {error && <p className="error">{error}</p>}

        <InvoiceFilterBar onFilter={handleFilterChange} />

        {isLoading && invoices.length === 0 ? (
          <p>Chargement des factures...</p>
        ) : getFilteredInvoices().length === 0 ? (
          <p>{invoices.length === 0 ? 'Aucune facture enregistrée pour le moment.' : 'Aucune facture ne correspond aux critères de filtre.'}</p>
        ) : (
          <div className="management-list">
            {getFilteredInvoices().map((invoice) => {
              const totals = computeTotals(invoice);
              return (
                <article key={invoice.id} className="invoice-card">
                  <div className="invoice-card-header">
                    <div>
                      <h3>{invoice.clientName}</h3>
                      <p className="muted">{invoice.registration || 'Immatriculation inconnue'}</p>
                    </div>
                    <div className="invoice-card-total">
                      <span>Total TTC</span>
                      <strong>{formatCurrency(totals.total)}</strong>
                    </div>
                  </div>
                  <div className="invoice-card-body">
                    <p>
                      <strong>Véhicule :</strong> {invoice.car || 'Non renseigné'}
                    </p>
                    <p>
                      <strong>Date :</strong>{' '}
                      {invoice.createdAt
                        ? new Date(invoice.createdAt).toLocaleString('fr-FR')
                        : '—'}
                    </p>
                    <div className="service-lines">
                      <p><strong>Prestations :</strong></p>
                      <ul>
                        {invoice.serviceLines?.map((line, idx) => (
                          <li key={idx}>
                            {line.service || 'Service'} — Qté: {line.quantity} — PU:{' '}
                            {formatCurrency(Number(line.unitPrice) || 0)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="card-actions">
                      <button
                        type="button"
                        className="btn secondary small"
                        onClick={() => startEditing(invoice)}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="btn danger small"
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        disabled={deletingId === invoice.id}
                      >
                        {deletingId === invoice.id ? 'Suppression...' : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {selectedInvoice && editForm && (
          <section className="edit-panel">
            <div className="edit-header">
              <div>
                <h2>Modifier la facture</h2>
                <p>Facture #{selectedInvoice.id}</p>
              </div>
              <button type="button" className="btn secondary" onClick={() => {
                setSelectedInvoice(null);
                setEditForm(null);
              }}>
                Annuler
              </button>
            </div>
            <InvoiceForm
              data={editForm}
              onChange={handleEditInputChange}
              onAddLine={handleAddEditLine}
              onRemoveLine={handleRemoveEditLine}
            />
            <InvoiceFooter totalTTC={computeEditFormTotal()} symbol={symbol} />
            <button
              type="button"
              className="btn"
              onClick={handleUpdateInvoice}
              disabled={isUpdating}
            >
              {isUpdating ? 'Mise à jour...' : 'Enregistrer les modifications'}
            </button>
          </section>
        )}
      </div>
    </>
  );
};

export default InvoiceManagement;


