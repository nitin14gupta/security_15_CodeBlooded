"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import apiService from "../api/apiService";
import { User } from "../api/config";

type AuthContextValue = {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string, onboardingData?: any) => Promise<{ success: boolean; error?: string }>;
    loginWithGoogle: (idToken: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
    resetPassword: (email: string, code: string, password: string) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = useMemo(() => !!user, [user]);

    // Load user data on app start
    useEffect(() => {
        const loadUser = async () => {
            try {
                const isAuth = await apiService.isAuthenticated();
                if (isAuth) {
                    const userData = await apiService.getCurrentUser();
                    setUser(userData);
                }
            } catch (error) {
                console.error("Error loading user:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            setIsLoading(true);
            const response = await apiService.login(email, password);

            if (response.success && response.data) {
                setUser(response.data.user);
                return { success: true };
            } else {
                return { success: false, error: response.error || "Login failed" };
            }
        } catch (error) {
            return { success: false, error: "Network error. Please check your connection." };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loginWithGoogle = useCallback(async (idToken: string) => {
        try {
            setIsLoading(true);
            const response = await apiService.loginWithGoogle(idToken);
            if (response.success && response.data) {
                setUser(response.data.user);
                return { success: true };
            }
            return { success: false, error: response.error || 'Google sign-in failed' };
        } catch (error) {
            return { success: false, error: 'Network error. Please check your connection.' };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (email: string, password: string, onboardingData?: any) => {
        try {
            setIsLoading(true);
            const response = await apiService.register(email, password, onboardingData);

            if (response.success && response.data) {
                setUser(response.data.user);
                return { success: true };
            } else {
                return { success: false, error: response.error || "Registration failed" };
            }
        } catch (error) {
            return { success: false, error: "Network error. Please check your connection." };
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiService.logout();
            setUser(null);
        } catch (error) {
            console.error("Error during logout:", error);
        }
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const userData = await apiService.refreshUserData();
            if (userData) {
                setUser(userData);
            }
        } catch (error) {
            console.error("Error refreshing user:", error);
        }
    }, []);

    const forgotPassword = useCallback(async (email: string) => {
        try {
            const response = await apiService.forgotPassword(email);
            if (response.success) {
                return { success: true };
            } else {
                return { success: false, error: response.error || "Failed to send reset code" };
            }
        } catch (error) {
            return { success: false, error: "Network error. Please check your connection." };
        }
    }, []);

    const resetPassword = useCallback(async (email: string, code: string, password: string) => {
        try {
            const response = await apiService.resetPasswordWithCode(email, code, password);
            if (response.success) {
                return { success: true };
            } else {
                return { success: false, error: response.error || "Failed to reset password" };
            }
        } catch (error) {
            return { success: false, error: "Network error. Please check your connection." };
        }
    }, []);

    const value = useMemo<AuthContextValue>(() => ({
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
        forgotPassword,
        resetPassword,
    }), [user, isAuthenticated, isLoading, login, register, loginWithGoogle, logout, refreshUser, forgotPassword, resetPassword]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};