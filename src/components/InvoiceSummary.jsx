import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

const InvoiceSummary = ({ data }) => {
    const { symbol, rate } = useCurrency();
    let subtotal = 0;

    // Calculate subtotal from all service lines
    data.serviceLines.forEach(line => {
        const quantity = parseInt(line.quantity) || 0;
        const unitPrice = parseFloat(line.unitPrice) || 0;
        subtotal += quantity * unitPrice;
    });

    const tvaRate = 0.20; // 20% VAT
    const tva = subtotal * tvaRate;
    const timbreFiscal = 1.00; // Timbre fiscal fixe à 1€
    const total = subtotal + tva + timbreFiscal;

    const formatCurrency = (amount) => `${(amount * rate).toFixed(2)} ${symbol}`;

    return (
        <div className="summary-section">
            <div className="summary-row">
                <span>TOTAL HT</span>
                <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="summary-row">
                <span>TOTAL TVA (20%)</span>
                <span>{formatCurrency(tva)}</span>
            </div>
            <div className="summary-row">
                <span>TIMBRE FISCAL</span>
                <span>{formatCurrency(timbreFiscal)}</span>
            </div>
            <div className="summary-row summary-total">
                <span>TOTAL TTC</span>
                <span>{formatCurrency(total)}</span>
            </div>
        </div>
    );
};

export default InvoiceSummary;
