'use client';

import React, { useState } from 'react';
import { useApiConfig } from './ApiConfigProvider';

interface ApiConfigFormProps {
  onConfigured?: () => void;
}

const ApiConfigForm: React.FC<ApiConfigFormProps> = ({ onConfigured }) => {
  const { apiConfig, updateApiConfig, isConfigured } = useApiConfig();
  
  // Local state for form inputs
  const [endpoint, setEndpoint] = useState(apiConfig.apiEndpoint);
  const [key, setKey] = useState(apiConfig.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(!isConfigured);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateApiConfig({
      apiEndpoint: endpoint,
      apiKey: key
    });
    setIsEditing(false);
    if (onConfigured) onConfigured();
  };

  // If configured and not editing, show a summary with edit button
  if (isConfigured && !isEditing) {
    return (
      <div className="p-4 bg-white rounded-lg shadow border border-gray-100 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-800">API Configuration</h3>
            <p className="text-sm text-gray-600">
              Endpoint: <span className="font-mono">{apiConfig.apiEndpoint}</span>
            </p>
            <p className="text-sm text-gray-600">
              API Key: <span className="font-mono">••••••••{apiConfig.apiKey.slice(-4)}</span>
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 text-sm transition-colors duration-200"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  // Otherwise, show the form
  return (
    <div className="p-4 bg-white rounded-lg shadow border border-gray-100 mb-6">
      <h3 className="font-semibold text-gray-800 mb-4">API Configuration</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="apiEndpoint" className="block text-sm font-medium text-gray-700 mb-1">
            API Endpoint
          </label>
          <input
            id="apiEndpoint"
            type="url"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://api.example.com"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#209e67] focus:border-[#209e67]"
            required
          />
        </div>
        
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <div className="relative">
            <input
              id="apiKey"
              type={showKey ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Your API key"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-[#209e67] focus:border-[#209e67]"
              required
            />
            <button
              type="button"
              className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          {isConfigured && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors duration-200"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-[#209e67] hover:bg-[#1c8a59] text-white rounded-md transition-colors duration-200 shadow-md"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApiConfigForm;