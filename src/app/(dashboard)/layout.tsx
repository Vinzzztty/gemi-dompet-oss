import '@/app/globals.css';
import { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';

export const viewport: Viewport = {
    themeColor: "#4176ED",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export const metadata: Metadata = {
    title: 'DompetKu - Kelola Keuanganmu',
    description: 'Aplikasi pengelolaan keuangan pribadi yang mudah dan praktis',
    keywords: ['keuangan', 'dompet', 'pengeluaran', 'pemasukan', 'budget'],
    authors: [{ name: 'DompetKu Team' }],
    manifest: "/manifest.webmanifest",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id" className="h-full">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            {/* Tambahkan background color agar kontras dengan card & min-h-screen */}
            <body className="min-h-screen bg-gray-50 font-sans antialiased text-gray-900">
                <Toaster
                    position="top-center"
                    richColors
                    closeButton
                    duration={3000}
                />
                <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                    {children}
                </main>
            </body>
        </html>
    );
}