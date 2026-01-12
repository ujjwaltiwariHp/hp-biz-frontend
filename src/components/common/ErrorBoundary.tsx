'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Typography } from '@/components/common/Typography';
import Button from '@/components/common/Button';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-boxdark-2 p-4">
                    <div className="max-w-md w-full bg-white dark:bg-boxdark rounded-xl shadow-2xl p-8 text-center border border-stroke dark:border-strokedark">
                        <div className="mx-auto w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mb-6">
                            <AlertTriangle size={40} className="text-danger" />
                        </div>

                        <Typography variant="page-title" as="h2" className="mb-2 text-2xl font-bold text-black dark:text-white">
                            Something went wrong
                        </Typography>

                        <Typography variant="body1" className="mb-6 text-gray-600 dark:text-gray-400">
                            We encountered an unexpected error. Our team has been notified. Please try refreshing the page.
                        </Typography>

                        {this.state.error && (
                            <div className="mb-6 p-4 bg-gray-100 dark:bg-black/20 rounded-lg text-left overflow-auto max-h-32 text-xs font-mono text-danger">
                                {this.state.error.toString()}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button
                                variant="primary"
                                onClick={this.handleRetry}
                                leftIcon={<RefreshCw size={18} />}
                            >
                                Reload Page
                            </Button>
                            <Button
                                variant="outline"
                                onClick={this.handleGoHome}
                                leftIcon={<Home size={18} />}
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
