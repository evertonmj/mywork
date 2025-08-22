'use client';

import Clock from '../../components/Clock';
import ManualEntryForm from '../../components/ManualEntryForm';
import { useTranslations } from 'next-intl';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

export default function Home() {
  const t = useTranslations();

  return (
    <Box component="main" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          {t('myWork')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('welcomeMessage')}
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Clock />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <ManualEntryForm />
      </Paper>
    </Box>
  );
}
