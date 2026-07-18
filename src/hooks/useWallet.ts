import { useState, useCallback } from 'react';

export interface Wallet {
    id: string;
    userId: string;
    namaDompet: string;
    norek: string | null;
    balance?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateWalletData {
    namaDompet: string;
    norek?: string;
}

export interface UpdateWalletData {
    id: string;
    namaDompet: string;
    norek?: string;
}

export const useWallet = () => {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getHeaders = useCallback(() => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        return headers;
    }, []);

    const fetchWallets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/wallets', {
                headers: getHeaders(),
            });
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized');
                }
                throw new Error('Failed to fetch wallets');
            }
            const data = await response.json();
            setWallets(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching wallets:', err);
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    const createWallet = useCallback(async (data: CreateWalletData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/wallets', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create wallet');
            }

            const newWallet = await response.json();
            setWallets((prev) => [newWallet, ...prev]);
            return newWallet;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error creating wallet:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    const updateWallet = useCallback(async (data: UpdateWalletData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/wallets', {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update wallet');
            }

            const updatedWallet = await response.json();
            setWallets((prev) =>
                prev.map((wallet) =>
                    wallet.id === updatedWallet.id ? updatedWallet : wallet
                )
            );
            return updatedWallet;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error updating wallet:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    const deleteWallet = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/wallets?id=${id}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete wallet');
            }

            setWallets((prev) => prev.filter((wallet) => wallet.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error deleting wallet:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    return {
        wallets,
        loading,
        error,
        fetchWallets,
        createWallet,
        updateWallet,
        deleteWallet,
    };
};
