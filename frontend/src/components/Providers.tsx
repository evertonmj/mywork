'use client';

import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';


type ProvidersProps = {
  children: ReactNode;
  messages: Record<string, unknown>;
  locale: string;
};

export default function Providers({ children, messages, locale }: ProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </Container>
    </ThemeProvider>
  );
}
