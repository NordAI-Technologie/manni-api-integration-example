'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define the shape of our API configuration
interface ApiConfig {
  apiEndpoint: string;
  apiKey: string;
}

// Define the shape of our context
interface ApiConfigContextType {
  apiConfig: ApiConfig;
  updateApiConfig: (config: Partial<ApiConfig>) => void;
  isConfigured: boolean;
}

// Create context with default values
const ApiConfigContext = createContext<ApiConfigContextType>({
  apiConfig: { apiEndpoint: '', apiKey: '' },
  updateApiConfig: () => {},
  isConfigured: false,
});

// Hook for components to use the API config
export const useApiConfig = () => useContext(ApiConfigContext);

interface ApiConfigProviderProps {
  children: ReactNode;
}

export const ApiConfigProvider: React.FC<ApiConfigProviderProps> = ({ children }) => {
  // Initialize state with empty values
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    apiEndpoint: '',
    apiKey: '',
  });

  // Check if we have valid configuration
  const isConfigured = Boolean(apiConfig.apiEndpoint && apiConfig.apiKey);

  // On component mount, try to load saved config from localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('apiConfig');
      if (savedConfig) {
        setApiConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Failed to load API config from localStorage:', error);
    }
  }, []);

  // Update config and save to localStorage
  const updateApiConfig = (newConfig: Partial<ApiConfig>) => {
    const updatedConfig = { ...apiConfig, ...newConfig };
    setApiConfig(updatedConfig);
    
    try {
      localStorage.setItem('apiConfig', JSON.stringify(updatedConfig));
    } catch (error) {
      console.error('Failed to save API config to localStorage:', error);
    }
  };

  return (
    <ApiConfigContext.Provider value={{ apiConfig, updateApiConfig, isConfigured }}>
      {children}
    </ApiConfigContext.Provider>
  );
};