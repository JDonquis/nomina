import { useState, useEffect } from 'react';

/**
 * Hook to persist table state in localStorage
 * @param {string} key - The key to store the state in localStorage
 * @param {Object} initialVisibility - The initial column visibility state
 * @returns {[Object, Function]} - The column visibility state and its setter
 */
export const useTableVisibility = (key, initialVisibility = {}) => {
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(`Error parsing localStorage key "${key}":`, e);
      }
    }
    return initialVisibility;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(columnVisibility));
  }, [key, columnVisibility]);

  return [columnVisibility, setColumnVisibility];
};
