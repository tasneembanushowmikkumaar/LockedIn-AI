import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

import { ConvexClientProvider } from "@/components/ConvexClientProvider";

export const metadata: Metadata = {
  title: 'LockedIn AI - Control Terminal',
  description: 'Dynamic AI-driven chastity control dashboard.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased overflow-x-hidden">
        <ConvexClientProvider>
          {children}
          <Toaster />
        </ConvexClientProvider>
      </body>

    </html>
  );
}
