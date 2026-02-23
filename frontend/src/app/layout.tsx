import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OneIT - IT Asset Management',
  description: 'Comprehensive IT Asset Management Platform for tracking assets, managing tickets, and streamlining IT operations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
