import React from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { useElements } from '../contexts/ElementsContext';

const InvoiceForm = ({ data, onChange, onAddLine, onRemoveLine }) => {
  const { symbol, currency } = useCurrency();
  const { services, cars } = useElements();

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  const handleServiceLineChange = (index, field, value) => {
    const newServiceLines = [...data.serviceLines];
    newServiceLines[index] = {
      ...newServiceLines[index],
      [field]: value
    };
    onChange('serviceLines', newServiceLines);
  };

  return (
    <div className="form-grid">
      <div className="form-group full-width">
        <label htmlFor="clientName">Nom du Client</label>
        <input
          type="text"
          id="clientName"
          name="clientName"
          value={data.clientName}
          onChange={handleChange}
          placeholder="Entrez le nom du client"
        />
      </div>

      <div className="form-group">
        <label htmlFor="registration">Immatriculation</label>
        <input
          type="text"
          id="registration"
          name="registration"
          value={data.registration}
          onChange={handleChange}
          placeholder="AA-123-BB"
        />
      </div>

      <div className="form-group">
        <label htmlFor="car">Voiture</label>
        <select
          id="car"
          name="car"
          value={data.car}
          onChange={handleChange}
        >
          <option value="">Sélectionner une voiture</option>
          {cars.map((car, index) => (
            <option key={index} value={car}>{car}</option>
          ))}
        </select>
      </div>

      <div className="full-width">
        <div className="services-header">
          <h3>Services</h3>
          <button type="button" className="btn-add" onClick={onAddLine}>
            + Ajouter une ligne
          </button>
        </div>

        {/* Table Header - shown only once */}
        <div className="service-table-header">
          <div className="service-col">Désignation Service</div>
          <div className="quantity-col">Quantité</div>
          <div className="price-col">P.U. HT ({currency} {symbol})</div>
          <div className="action-col"></div>
        </div>

        {/* Service Lines */}
        {data.serviceLines.map((line, index) => (
          <div key={index} className="service-details-row">
            <div className="service-col">
              <select
                id={`service-${index}`}
                value={line.service}
                onChange={(e) => handleServiceLineChange(index, 'service', e.target.value)}
              >
                <option value="">Sélectionner un service</option>
                {services.map((service, idx) => (
                  <option key={idx} value={service}>{service}</option>
                ))}
              </select>
            </div>

            <div className="quantity-col">
              <input
                type="number"
                id={`quantity-${index}`}
                min="1"
                max="10"
                value={line.quantity}
                onChange={(e) => handleServiceLineChange(index, 'quantity', e.target.value)}
              />
            </div>

            <div className="price-col">
              <input
                type="number"
                id={`unitPrice-${index}`}
                min="0"
                step="0.01"
                value={line.unitPrice}
                onChange={(e) => handleServiceLineChange(index, 'unitPrice', e.target.value)}
                placeholder={`Prix unitaire (${symbol})`}
              />
            </div>

            <div className="action-col">
              {data.serviceLines.length > 1 && (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => onRemoveLine(index)}
                  title="Supprimer cette ligne"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvoiceForm;
