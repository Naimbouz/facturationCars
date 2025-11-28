/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useMemo } from 'react';

const CurrencyContext = createContext({
  currency: 'EUR',
  symbol: '€',
  rate: 1,
  setCurrency: () => {}
});

const currencyMap = {
  EUR: {
    code: 'EUR',
    symbol: '€',
    rate: 1
  },
  DZD: {
    code: 'DZD',
    symbol: 'د.ج',
    rate: 215 // Approximate conversion, can be adjusted or fetched dynamically
  }
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('EUR');

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


