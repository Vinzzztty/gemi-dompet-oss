/**
 * Format number to Indonesian Rupiah currency
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount).replace('IDR', 'Rp');
}

/**
 * Format number with thousand separator (Indonesian format)
 */
export function formatNumber(amount: number): string {
    return new Intl.NumberFormat('id-ID').format(amount);
}

/**
 * Format date to localized string
 */
export function formatDate(date: Date | string): string {
    // Handle invalid dates
    if (!date) return '-';
    
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
        console.error('Invalid date:', date);
        return '-';
    }
    
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(dateObj);
}

/**
 * Format date to full Indonesian format (e.g., "Kamis, 1 Januari 2026")
 */
export function formatFullDate(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}

/**
 * Get month name in Indonesian
 */
export function getMonthName(month: number): string {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month];
}

/**
 * Format amount with sign for display
 */
export function formatAmountWithSign(amount: number, type: 'income' | 'expense'): string {
    const sign = type === 'income' ? '+' : '-';
    return `${sign}Rp ${formatNumber(Math.abs(amount))}`;
}
