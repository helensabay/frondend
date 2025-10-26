import React, { createContext, useContext, useMemo, useState } from 'react';

const ApiContext = createContext({
  lastError: null,
  setLastError: () => {},
  lastEvent: null,
  setLastEvent: () => {},
});

export function ApiProvider({ children }) {
  const [lastError, setLastError] = useState(null);
  const [lastEvent, setLastEvent] = useState(null);

  // You can manually update errors/events in other parts of your app if needed.
  const value = useMemo(
    () => ({
      lastError,
      setLastError,
      lastEvent,
      setLastEvent,
    }),
    [lastError, lastEvent]
  );

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApiConfig() {
  return useContext(ApiContext);
}
