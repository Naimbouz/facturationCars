import React, { createContext, useState, useContext, useEffect } from 'react';

const ElementsContext = createContext({
  services: [],
  cars: [],
  addService: () => {},
  removeService: () => {},
  addCar: () => {},
  removeCar: () => {},
  setServices: () => {},
  setCars: () => {}
});

const defaultServices = [
  'Vidange',
  'Changement de pneus',
  'Révision complète',
  'Changement de plaquettes',
  'Diagnostic électronique',
  'Lavage complet'
];

const defaultCars = [
  'Toyota Corolla',
  'Volkswagen Golf',
  'Renault Clio',
  'Peugeot 208',
  'Ford Fiesta',
  'Mercedes A-Class',
  'BMW 1 Series'
];

export const ElementsProvider = ({ children }) => {
  const [services, setServices] = useState(() => {
    const stored = localStorage.getItem('elements_services');
    return stored ? JSON.parse(stored) : defaultServices;
  });

  const [cars, setCars] = useState(() => {
    const stored = localStorage.getItem('elements_cars');
    return stored ? JSON.parse(stored) : defaultCars;
  });

  // Sauvegarder dans localStorage chaque fois qu'ils changent
  useEffect(() => {
    localStorage.setItem('elements_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('elements_cars', JSON.stringify(cars));
  }, [cars]);

  const addService = (service) => {
    if (service.trim() && !services.includes(service)) {
      setServices([...services, service.trim()]);
    }
  };

  const removeService = (index) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const addCar = (car) => {
    if (car.trim() && !cars.includes(car)) {
      setCars([...cars, car.trim()]);
    }
  };

  const removeCar = (index) => {
    setCars(cars.filter((_, i) => i !== index));
  };

  const value = {
    services,
    cars,
    addService,
    removeService,
    addCar,
    removeCar,
    setServices,
    setCars
  };

  return (
    <ElementsContext.Provider value={value}>
      {children}
    </ElementsContext.Provider>
  );
};

export const useElements = () => {
  const context = useContext(ElementsContext);
  if (!context) {
    throw new Error('useElements must be used within ElementsProvider');
  }
  return context;
};
