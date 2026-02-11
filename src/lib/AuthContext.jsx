import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Vereinfachte Auth-Logik:
  // Die App läuft komplett ohne externes Login / Base44.
  const [user] = useState(null);
  const [isAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState(null);

  useEffect(() => {
    // Direkt nach dem Mount: keine Ladezustände / Fehler
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
    setAuthError(null);
  }, []);

  const checkAppState = async () => {
    // Für das lokale Setup gibt es keinen externen App-Status.
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
    setAuthError(null);
  };

  const checkUserAuth = async () => {
    // Keine echte Authentifizierung nötig
    setIsLoadingAuth(false);
    setAuthError(null);
  };

  const logout = (shouldRedirect = true) => {
    // Platzhalter – keine Wirkung im lokalen Modus
    console.log('[AuthContext] logout() aufgerufen (ohne echte Authentifizierung)');
  };

  const navigateToLogin = () => {
    // Es gibt keine Login-Seite im lokalen Modus
    console.log('[AuthContext] navigateToLogin() aufgerufen (ohne echte Authentifizierung)');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
