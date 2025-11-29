import React, { useState } from 'react';

const InvoiceFilterBar = ({ onFilter }) => {
  const [clientName, setClientName] = useState('');
  const [car, setCar] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleApply = () => {
    onFilter({
      clientName: clientName.trim(),
      car: car.trim(),
      dateFrom: dateFrom || null,
      dateTo: dateTo || null
    });
  };

  const handleClear = () => {
    setClientName('');
    setCar('');
    setDateFrom('');
    setDateTo('');
    onFilter({
      clientName: '',
      car: '',
      dateFrom: null,
      dateTo: null
    });
  };

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <input
          type="text"
          placeholder="Nom du client..."
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Véhicule..."
          value={car}
          onChange={(e) => setCar(e.target.value)}
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          title="De (date)"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          title="À (date)"
        />
        <button type="button" className="btn" onClick={handleApply}>
          Appliquer
        </button>
        <button type="button" className="btn secondary" onClick={handleClear}>
          Effacer
        </button>
      </div>
    </div>
  );
};

export default InvoiceFilterBar;
