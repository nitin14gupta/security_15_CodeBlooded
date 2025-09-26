'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface OnboardingData {
    morningPreference: 'tea' | 'coffee' | 'good_vibes' | '';
    dayColor: string;
    moodEmoji: string;
    lifeGenre: 'comedy' | 'drama' | 'adventure' | '';
    weeklyGoal: string;
    favoriteApp: string;
}

interface OnboardingContextType {
    onboardingData: OnboardingData;
    updateOnboardingData: (data: Partial<OnboardingData>) => void;
    resetOnboardingData: () => void;
    isOnboardingComplete: () => boolean;
}

const defaultOnboardingData: OnboardingData = {
    morningPreference: '',
    dayColor: '',
    moodEmoji: '',
    lifeGenre: '',
    weeklyGoal: '',
    favoriteApp: '',
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
};

interface OnboardingProviderProps {
    children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
    const [onboardingData, setOnboardingData] = useState<OnboardingData>(() => {
        // Try to load from localStorage
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('onboardingData');
            if (saved) {
                try {
                    return { ...defaultOnboardingData, ...JSON.parse(saved) };
                } catch (error) {
                    console.error('Error parsing onboarding data from localStorage:', error);
                }
            }
        }
        return defaultOnboardingData;
    });

    const updateOnboardingData = (data: Partial<OnboardingData>) => {
        const newData = { ...onboardingData, ...data };
        setOnboardingData(newData);

        // Save to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('onboardingData', JSON.stringify(newData));
        }
    };

    const resetOnboardingData = () => {
        setOnboardingData(defaultOnboardingData);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('onboardingData');
        }
    };

    const isOnboardingComplete = () => {
        return (
            onboardingData.morningPreference !== '' &&
            onboardingData.dayColor !== '' &&
            onboardingData.moodEmoji !== '' &&
            onboardingData.lifeGenre !== '' &&
            onboardingData.weeklyGoal !== '' &&
            onboardingData.favoriteApp !== ''
        );
    };

    const value: OnboardingContextType = {
        onboardingData,
        updateOnboardingData,
        resetOnboardingData,
        isOnboardingComplete,
    };

    return (
        <OnboardingContext.Provider value={value}>
            {children}
        </OnboardingContext.Provider>
    );
};
