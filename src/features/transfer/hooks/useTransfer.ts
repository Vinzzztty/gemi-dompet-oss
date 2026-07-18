import { useState, useCallback } from 'react';

export interface TransferTransaction {
    id: string;
    userId: string;
    fromWalletId: string;
    toWalletId: string;
    amount: number | string;
    date: string;
    note?: string;
    fromWallet?: {
        id: string;
        namaDompet: string;
    };
    toWallet?: {
        id: string;
        namaDompet: string;
    };
    createdAt?: string;
}

export const useTransfer = () => {
    const [data, setData] = useState<TransferTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getHeaders = useCallback(() => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        return headers;
    }, []);

    const fetchTransfers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/transfer', {
                headers: getHeaders(),
            });
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized');
                }
                throw new Error('Failed to fetch transfers');
            }
            const transferData = await response.json();
            setData(transferData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching transfers:', err);
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    return {
        data,
        loading,
        error,
        fetch: fetchTransfers,
    };
};
