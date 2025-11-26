import React from 'react';

const InvoiceForm = ({ data, onChange }) => {
  const cars = [
    "Toyota Corolla",
    "Volkswagen Golf",
    "Renault Clio",
    "Peugeot 208",
    "Ford Fiesta",
    "Mercedes A-Class",
    "BMW 1 Series"
  ];

  const services = [
    "Vidange",
    "Changement de pneus",
    "Révision complète",
    "Changement de plaquettes",
    "Diagnostic électronique",
    "Lavage complet"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange(name, value);
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

      <div className="form-group full-width">
        <label htmlFor="service">Désignation Service</label>
        <select
          id="service"
          name="service"
          value={data.service}
          onChange={handleChange}
        >
          <option value="">Sélectionner un service</option>
          {services.map((service, index) => (
            <option key={index} value={service}>{service}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="quantity">Quantité (1-10)</label>
        <input
          type="number"
          id="quantity"
          name="quantity"
          min="1"
          max="10"
          value={data.quantity}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="unitPrice">P.U. HT (€)</label>
        <input
          type="number"
          id="unitPrice"
          name="unitPrice"
          min="0"
          step="0.01"
          value={data.unitPrice}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default InvoiceForm;
