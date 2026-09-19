'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserPreferences {
  [key: string]: any;
}

interface UserContextType {
  budget: number;
  preferences: UserPreferences;
  isLoading: boolean;
  updateBudget: (newBudget: number) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [budget, setBudget] = useState<number>(35000);
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserPreferences() {
      try {
        const res = await fetch('/api/user/preferences');
        if (res.ok) {
          const data = await res.json();
          if (data.budget) setBudget(data.budget);
          if (data.preferences) setPreferences(data.preferences);
        }
      } catch (error) {
        console.error('Failed to fetch user preferences:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchUserPreferences();
  }, []);

  const updateBudget = async (newBudget: number): Promise<boolean> => {
    // Optimistic update
    const previousBudget = budget;
    setBudget(newBudget);

    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: newBudget }),
      });

      if (!res.ok) {
        throw new Error('Failed to update budget');
      }
      
      const data = await res.json();
      if (data.budget) {
        setBudget(data.budget);
      }
      return true;
    } catch (error) {
      console.error('Error updating budget:', error);
      // Revert on failure
      setBudget(previousBudget);
      return false;
    }
  };

  return (
    <UserContext.Provider value={{ budget, preferences, isLoading, updateBudget }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
