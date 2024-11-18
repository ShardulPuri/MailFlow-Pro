import React, { createContext, useContext, useState } from 'react';

const TemplateContext = createContext(null);

export const TemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTemplates = async (filters = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/templates?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTemplate = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/templates/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setActiveTemplate(data);
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (templateData) => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(templateData)
      });
      const data = await response.json();
      setTemplates([...templates, data]);
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async (id, updates) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      setTemplates(templates.map(t => t._id === id ? data : t));
      if (activeTemplate?._id === id) {
        setActiveTemplate(data);
      }
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id) => {
    try {
      setLoading(true);
      await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setTemplates(templates.filter(t => t._id !== id));
      if (activeTemplate?._id === id) {
        setActiveTemplate(null);
      }
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <TemplateContext.Provider value={{
      templates,
      activeTemplate,
      loading,
      error,
      fetchTemplates,
      getTemplate,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      setActiveTemplate
    }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplate = () => useContext(TemplateContext); 