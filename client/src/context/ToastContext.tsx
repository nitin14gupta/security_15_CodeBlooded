"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Toast context for managing notifications

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast: Toast = {
            ...toast,
            id,
            duration: toast.duration || 5000, // default 5 seconds
        };

        console.log('Adding toast:', toast.title); // debug
        setToasts(prev => [...prev, newToast]);

        // Auto remove toast after duration
        setTimeout(() => {
            removeToast(id);
        }, newToast.duration);
    };

    const removeToast = (id: string) => {
        console.log('Removing toast:', id); // debug
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const success = (title: string, message?: string) => {
        addToast({ type: 'success', title, message });
    };

    const error = (title: string, message?: string) => {
        addToast({ type: 'error', title, message });
    };

    const warning = (title: string, message?: string) => {
        addToast({ type: 'warning', title, message });
    };

    const info = (title: string, message?: string) => {
        addToast({ type: 'info', title, message });
    };

    const value: ToastContextType = {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

interface ToastContainerProps {
    toasts: Toast[];
    removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
};

interface ToastItemProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
    const getToastStyles = () => {
        switch (toast.type) {
            case 'success':
                return 'bg-green-500 border-green-400 text-white';
            case 'error':
                return 'bg-red-500 border-red-400 text-white';
            case 'warning':
                return 'bg-yellow-500 border-yellow-400 text-white';
            case 'info':
                return 'bg-blue-500 border-blue-400 text-white';
            default:
                return 'bg-gray-500 border-gray-400 text-white';
        }
    };

    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
                return 'ℹ';
            default:
                return '•';
        }
    };

    return (
        <div
            className={`max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${getToastStyles()}`}
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <span className="text-lg">{getIcon()}</span>
                    </div>
                    <div className="ml-3 w-0 flex-1">
                        <p className="text-sm font-medium">{toast.title}</p>
                        {toast.message && (
                            <p className="mt-1 text-sm opacity-90">{toast.message}</p>
                        )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            className="inline-flex text-white hover:text-gray-200 focus:outline-none"
                            onClick={() => onRemove(toast.id)}
                        >
                            <span className="sr-only">Close</span>
                            <span className="text-lg">×</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
