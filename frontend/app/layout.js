
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { Inter } from 'next/font/google';
import Navbar from './components/Navbar';
import SessionChecker from './components/SessionChecker';
import SupabaseListener from './components/SupabaseListener';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Law & Verdict',
  description: 'Insights into the modern legal landscape.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <SessionChecker />
          <SupabaseListener />
          <div className="flex min-h-screen flex-col bg-gray-50">
            <Navbar />
            <main className="flex-grow">{children}</main>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}

