import React, { createContext, useContext, useState } from 'react';

const DataSourceContext = createContext(null);

export const DataSourceProvider = ({ children }) => {
  const [dataSources, setDataSources] = useState([]);
  const [activeDataSource, setActiveDataSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDataSources = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/datasource/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setDataSources(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectDataSource = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/datasource/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setActiveDataSource(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataSourceContext.Provider value={{
      dataSources,
      activeDataSource,
      loading,
      error,
      fetchDataSources,
      selectDataSource,
      setActiveDataSource
    }}>
      {children}
    </DataSourceContext.Provider>
  );
};

export const useDataSource = () => useContext(DataSourceContext); 