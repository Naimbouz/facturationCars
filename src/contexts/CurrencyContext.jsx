/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useMemo } from 'react';

const CurrencyContext = createContext({
  currency: 'TND',
  symbol: 'د.ت',
  rate: 3.2,
  setCurrency: () => {}
});

const currencyMap = {
  EUR: {
    code: 'EUR',
    symbol: '€',
    rate: 1
  },
  TND: {
    code: 'TND',
    symbol: 'د.ت',
    rate: 3.2 // Approximate conversion (1 EUR ≈ 3.2 TND), adjust or fetch dynamically as needed
  }
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('TND');

  const value = useMemo(() => {
    const info = currencyMap[currency];
    return {
      currency: info.code,
      symbol: info.symbol,
      rate: info.rate,
      setCurrency
    };
  }, [currency]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);


