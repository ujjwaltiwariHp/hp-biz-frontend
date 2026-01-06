import '@/css/style.css';
import '@/css/satoshi.css';
import '@/css/typography.css';
import React, { ReactNode } from 'react';
import QueryProvider  from '@/context/QueryProvider';
import { SSEProvider } from '@/context/SSEContext';

export const metadata = {
  title: 'Hp-Biz',
  description: 'Super Admin Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <QueryProvider>
          <SSEProvider>
            <div className="dark:bg-boxdark-2 dark:text-bodydark">
              {children}
            </div>
          </SSEProvider>
        </QueryProvider>
      </body>
    </html>
  );
}