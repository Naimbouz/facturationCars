import React from 'react';

const InvoiceSummary = ({ data }) => {
    let subtotal = 0;

    // Calculate subtotal from all service lines
    data.serviceLines.forEach(line => {
        const quantity = parseInt(line.quantity) || 0;
        const unitPrice = parseFloat(line.unitPrice) || 0;
        subtotal += quantity * unitPrice;
    });

    const tvaRate = 0.20; // 20% VAT
    const tva = subtotal * tvaRate;
    const total = subtotal + tva;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    return (
        <div className="summary-section">
            <div className="summary-row">
                <span>Total HT</span>
                <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="summary-row">
                <span>TVA (20%)</span>
                <span>{formatCurrency(tva)}</span>
            </div>
            <div className="summary-row">
                <span>Total TTC</span>
                <span>{formatCurrency(total)}</span>
            </div>
        </div>
    );
};

export default InvoiceSummary;
