import React from 'react';
import { numberToWords } from '../utils/numberToWords';

const InvoiceFooter = ({ totalTTC, symbol }) => {
  const totalInLetters = numberToWords(Math.floor(totalTTC));

  return (
    <div className="invoice-footer">
      <p>
        Arrêtée la présente facture à la somme de: <strong>{totalInLetters}</strong> {symbol}
      </p>
    </div>
  );
};

export default InvoiceFooter;
