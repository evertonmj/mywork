import {getMessages} from 'next-intl/server';
import Providers from '../../components/Providers';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <Providers messages={messages} locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
