import React, { useEffect, useState } from 'react';
import TopNav from '../components/TopNav';
import ElementManager from '../components/ElementManager';
import { useElements } from '../contexts/ElementsContext';

const ElementManagement = () => {
  const { services, cars, addService, removeService, addCar, removeCar } = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Charger les éléments du serveur si disponible
    fetchElements();
  }, []);

  const fetchElements = async () => {
    setLoading(true);
    try {
      // Optionnel : récupérer depuis le serveur
      // const response = await fetch('http://localhost:4000/api/elements');
      // if (response.ok) {
      //   const data = await response.json();
      //   setServices(data.services || services);
      //   setCars(data.cars || cars);
      // }
    } catch (err) {
      console.error('Erreur lors du chargement des éléments:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveElements = async () => {
    setLoading(true);
    setError(null);
    try {
      // Les éléments sont automatiquement sauvegardés en localStorage
      // via le contexte ElementsContext
      setSuccessMessage('Éléments sauvegardés avec succès !');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = (newService) => {
    if (!services.includes(newService)) {
      addService(newService);
    }
  };

  const handleRemoveService = (index) => {
    removeService(index);
  };

  const handleAddCar = (newCar) => {
    if (!cars.includes(newCar)) {
      addCar(newCar);
    }
  };

  const handleRemoveCar = (index) => {
    removeCar(index);
  };

  return (
    <>
      <TopNav />
      <div className="management-container">
        <header className="management-header">
          <div>
            <h1>Gestion d'éléments</h1>
            <p>Gérez les services et les voitures disponibles</p>
          </div>
          <div className="management-actions">
            <button
              className="btn"
              type="button"
              onClick={saveElements}
              disabled={loading}
            >
              {loading ? 'Sauvegarde...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </header>

        {error && <p className="error">{error}</p>}
        {successMessage && <p className="success">{successMessage}</p>}

        <div className="elements-grid">
          <ElementManager
            title="Services"
            items={services}
            onAdd={handleAddService}
            onRemove={handleRemoveService}
            placeholder="Ex: Révision, Changement d'huile..."
          />
          <ElementManager
            title="Voitures"
            items={cars}
            onAdd={handleAddCar}
            onRemove={handleRemoveCar}
            placeholder="Ex: Toyota Corolla, BMW 3..."
          />
        </div>
      </div>
    </>
  );
};

export default ElementManagement;
