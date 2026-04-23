import { useState, useEffect } from 'react';
import { User, CardConfig, Theme } from './types';
import Auth from './components/Auth';
import SetupWizard from './components/SetupWizard';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [cards, setCards] = useState<CardConfig[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    document.body.className = `theme-${theme} bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors duration-300`;
  }, [theme]);

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  if (!isSetupComplete) {
    return (
      <SetupWizard 
        onComplete={(configuredCards) => {
          setCards(configuredCards);
          setIsSetupComplete(true);
        }} 
      />
    );
  }

  return (
    <Dashboard 
      cards={cards} 
      setCards={setCards}
      user={user} 
      theme={theme}
      setTheme={setTheme}
      onReset={() => setIsSetupComplete(false)} 
      onLogout={() => {
        setUser(null);
        setIsSetupComplete(false);
      }}
    />
  );
}
