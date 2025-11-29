import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCurrency } from '../contexts/CurrencyContext';

const TopNav = () => {
  const { currency, setCurrency } = useCurrency();

  return (
    <nav className="top-nav">
      <div className="nav-brand">STE AJK PERFECT AUTO</div>
      <div className="nav-links">
        <NavLink to="/" end>
          Nouvelle facture
        </NavLink>
        <NavLink to="/invoices">
          Gestion des factures
        </NavLink>
        <NavLink to="/elements">
          Gestion d'éléments
        </NavLink>
        <select
          className="currency-select"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="EUR">EUR (€)</option>
          <option value="TND">Dinar tunisien (TND) (دت)</option>
        </select>
      </div>
    </nav>
  );
};

export default TopNav;


