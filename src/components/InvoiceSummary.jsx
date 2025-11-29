import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

const InvoiceSummary = ({ data }) => {
    const { symbol, rate } = useCurrency();
    let subtotal = 0;

    // Calculate subtotal from all service lines (guard if data or serviceLines missing)
    const lines = data?.serviceLines ?? [];
    lines.forEach(line => {
        const quantity = parseInt(line.quantity) || 0;
        const unitPrice = parseFloat(line.unitPrice) || 0;
        subtotal += quantity * unitPrice;
    });

    const tvaRate = 0.19; // 19% VAT
    const tva = subtotal * tvaRate;
    // Make timbre fiscal equal to 1 TND: when symbol is TND, convert 1 TND into base units so formatCurrency shows 1
    const timbreFiscalBase = (symbol === 'د.ت') ? (1 / rate) : 1.0;
    const total = subtotal + tva + timbreFiscalBase;

    const formatCurrency = (amount) => {
        const num = Number(amount) || 0;
        return `${(num * rate).toFixed(2)} ${symbol}`;
    };

    return (
        <div className="summary-section">
            <div className="summary-row">
                <span>TOTAL HT</span>
                <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="summary-row">
                <span>TOTAL TVA (19%)</span>
                <span>{formatCurrency(tva)}</span>
            </div>
            <div className="summary-row">
                <span>TIMBRE FISCAL</span>
                <span>{formatCurrency(timbreFiscalBase)}</span>
            </div>
            <div className="summary-row summary-total">
                <span>TOTAL TTC</span>
                <span>{formatCurrency(total)}</span>
            </div>
        </div>
    );
};

export default InvoiceSummary;
