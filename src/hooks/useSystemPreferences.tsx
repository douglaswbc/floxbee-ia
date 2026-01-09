import { useState, useEffect } from 'react';

export interface SystemPreferences {
  // AI Settings
  aiAutoResponse: boolean;
  aiAutoTransferAfterAttempts: number;
  aiFeedbackCollection: boolean;
  aiLearningMode: boolean;
  aiModel: string;

  // Notifications
  notifyNewConversations: boolean;
  notifyPriorityTickets: boolean;
  dailyEmailSummary: boolean;
  soundEnabled: boolean;

  // Business Hours
  businessHoursEnabled: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  businessDays: number[];

  // SLA Settings
  slaEnabled: boolean;
  slaLowPriority: number;
  slaMediumPriority: number;
  slaHighPriority: number;
  slaUrgentPriority: number;

  // Frequency Limit Settings
  frequencyLimitEnabled: boolean;
  frequencyLimitHours: number;
}

const DEFAULT_PREFERENCES: SystemPreferences = {
  aiAutoResponse: true,
  aiAutoTransferAfterAttempts: 3,
  aiFeedbackCollection: true,
  aiLearningMode: false,
  aiModel: 'gpt-4o-mini',

  notifyNewConversations: true,
  notifyPriorityTickets: true,
  dailyEmailSummary: false,
  soundEnabled: true,

  businessHoursEnabled: true,
  businessHoursStart: '08:00',
  businessHoursEnd: '18:00',
  businessDays: [1, 2, 3, 4, 5],

  slaEnabled: true,
  slaLowPriority: 72,
  slaMediumPriority: 48,
  slaHighPriority: 24,
  slaUrgentPriority: 4,

  frequencyLimitEnabled: true,
  frequencyLimitHours: 24,
};

const STORAGE_KEY = 'floxbee_system_preferences';

export function useSystemPreferences() {
  const [preferences, setPreferences] = useState<SystemPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      } catch (e) {
        console.error('Error parsing preferences:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    }
  }, [preferences, isLoaded]);

  const updatePreference = <K extends keyof SystemPreferences>(
    key: K,
    value: SystemPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const updateMultiple = (updates: Partial<SystemPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updates }));
  };

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  return {
    preferences,
    updatePreference,
    updateMultiple,
    resetToDefaults,
    isLoaded,
  };
}
