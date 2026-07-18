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
    title: 'DompetKu - Login',
    description: 'Masuk ke akun DompetKu Anda',
    manifest: "/manifest.webmanifest",
};

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <Toaster
                    position="top-center"
                    richColors
                    closeButton
                    duration={3000}
                />
                <main className="main-container">
                    {children}
                </main>
            </body>
        </html>
    );
}
