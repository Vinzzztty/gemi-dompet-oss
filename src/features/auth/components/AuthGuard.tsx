'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/loading';
import { isAuthenticated as hasClientSession } from '@/lib/auth-client';

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!hasClientSession()) {
            router.push('/login');
            setIsAuthenticated(false);
        } else {
            setIsAuthenticated(true);
        }

        setIsLoading(false);
    }, [router]);

    // Show loading state during initial check
    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                color: 'var(--text-secondary)'
            }}>
                <p>Loading...</p>
            </div>
        );
    }

    // Don't render children if not authenticated
    if (!isAuthenticated) {
        return <Loading fullScreen />;
    }

    return <>{children}</>;
}
