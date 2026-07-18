import React from 'react';
import { Wallet } from '@/hooks/useWallet';

interface TransferFormProps {
    wallets: Wallet[];
    loadingWallets: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const TransferForm: React.FC<TransferFormProps> = ({
    wallets,
    loadingWallets,
    onClose,
    onSuccess,
}) => {
    const [fromWalletId, setFromWalletId] = React.useState<string>('');
    const [toWalletId, setToWalletId] = React.useState<string>('');
    const [amount, setAmount] = React.useState<string>('');
    const [date, setDate] = React.useState<string>(new Date().toISOString().split('T')[0]);
    const [note, setNote] = React.useState<string>('');
    const [loading, setLoading] = React.useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fromWalletId,
                    toWalletId,
                    amount,
                    date,
                    note,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                onSuccess();
            } else {
                alert(data.message || 'Gagal melakukan transfer');
            }
        } catch (error) {
            console.error('Transfer error:', error);
            alert('Terjadi kesalahan saat melakukan transfer');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: string) => {
        if (!val) return '';
        const number = parseInt(val, 10);
        return new Intl.NumberFormat('id-ID').format(number);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Dari Dompet</label>
                <select
                    value={fromWalletId}
                    onChange={(e) => setFromWalletId(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                    <option value="">Pilih Dompet Asal</option>
                    {wallets.map((wallet) => (
                        <option key={wallet.id} value={wallet.id} disabled={wallet.id === toWalletId}>
                            {wallet.namaDompet}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Ke Dompet</label>
                <select
                    value={toWalletId}
                    onChange={(e) => setToWalletId(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                    <option value="">Pilih Dompet Tujuan</option>
                    {wallets.map((wallet) => (
                        <option key={wallet.id} value={wallet.id} disabled={wallet.id === fromWalletId}>
                            {wallet.namaDompet}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Jumlah Transfer</label>
                <input
                    type="text"
                    value={formatCurrency(amount)}
                    onChange={(e) => {
                        const val = e.target.value.replace(/\./g, '');
                        if (!isNaN(Number(val))) {
                            setAmount(val);
                        }
                    }}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    placeholder="0"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Tanggal</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Catatan (Optional)</label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    rows={3}
                />
            </div>

            <div className="flex gap-2 justify-end pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                    Batal
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                >
                    {loading ? 'Memproses...' : 'Transfer Sekarang'}
                </button>
            </div>
        </form>
    );
};
