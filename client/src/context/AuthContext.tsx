"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiService, OnboardingData } from '@/api/apiService';

// Auth context for managing user authentication state

export interface User {
    id: string;
    email: string;
    name: string;
    user_type: 'user' | 'admin';
    created_at: string;
    // Onboarding fields
    morning_preference?: string;
    day_color?: string;
    mood_emoji?: string;
    life_genre?: string;
    weekly_goal?: string;
    favorite_app?: string;
    onboarding_completed?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, isAdmin: boolean, onboarding?: OnboardingData) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for existing session on mount
        console.log('AuthProvider mounted, checking auth status...'); // debug
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            console.log('Checking auth status, token exists:', !!token); // debug
            if (!token) {
                setLoading(false);
                return;
            }

            // Verify token with backend
            console.log('Verifying token with backend...'); // debug
            const userData = await apiService.verifyToken();
            setUser(userData);
            console.log('User authenticated:', userData.name); // debug
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('auth_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            console.log('Attempting login for user:', email); // debug
            const data = await apiService.login({ email, password });

            localStorage.setItem('auth_token', data.token);
            setUser(data.user);
            console.log('Login successful, user type:', data.user.user_type); // debug

            // Navigate based on user type
            if (data.user.user_type === 'admin') {
                console.log('Redirecting to admin dashboard'); // debug
                router.push('/adminMain');
            } else {
                console.log('Redirecting to main dashboard'); // debug
                router.push('/main');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (name: string, email: string, password: string, isAdmin: boolean, onboarding?: OnboardingData) => {
        try {
            setLoading(true);
            console.log('Registering new user:', email, 'isAdmin:', isAdmin, 'with onboarding:', !!onboarding); // debug
            const data = await apiService.register({
                name,
                email,
                password,
                user_type: isAdmin ? 'admin' : 'user',
                onboarding
            });

            localStorage.setItem('auth_token', data.token);
            setUser(data.user);
            console.log('Registration successful, user type:', data.user.user_type); // debug

            // Navigate based on user type
            if (data.user.user_type === 'admin') {
                console.log('Redirecting to admin dashboard'); // debug
                router.push('/adminMain');
            } else {
                console.log('Redirecting to main dashboard'); // debug
                router.push('/main');
            }
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            console.log('Logging out user...'); // debug
            await apiService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('auth_token');
            setUser(null);
            console.log('User logged out, redirecting to home'); // debug
            router.push('/');
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
