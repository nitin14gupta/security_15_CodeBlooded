import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type OnboardingAnswers = {
  tradingType?: 'day' | 'swing' | 'longterm';
  riskTolerance?: 'low' | 'medium' | 'high';
  experienceLevel?: 'beginner' | 'intermediate' | 'expert';
  investmentGoals?: string[];
};

type OnboardingContextValue = {
  answers: OnboardingAnswers;
  setAnswer: (key: keyof OnboardingAnswers, value: any) => void;
  reset: () => void;
  isLoading: boolean;
  isError: string | null;
};

const STORAGE_KEY = "chartai:onboarding";

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setAnswers(JSON.parse(saved));
        }
      } catch (e: any) {
        setIsError(e?.message ?? "Failed to load onboarding state");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: OnboardingAnswers) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      // ignore persist errors silently for now
    }
  }, []);

  const setAnswer = useCallback((key: keyof OnboardingAnswers, value: any) => {
    setAnswers(prev => {
      const next = { ...prev, [key]: value } as OnboardingAnswers;
      persist(next);
      return next;
    });
  }, [persist]);

  const reset = useCallback(() => {
    const empty: OnboardingAnswers = {};
    setAnswers(empty);
    persist(empty);
  }, [persist]);

  const value = useMemo<OnboardingContextValue>(() => ({ answers, setAnswer, reset, isLoading, isError }), [answers, isLoading, isError, setAnswer, reset]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
};


