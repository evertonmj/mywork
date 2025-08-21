'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';

// Helpers
function toLocalYMD(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDurationFromHours(totalHours: number, showSeconds = false): string {
  if (!isFinite(totalHours) || isNaN(totalHours)) return '—';
  const totalSeconds = Math.floor(totalHours * 3600);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return showSeconds ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${hours}:${pad(minutes)}`;
}

function formatDateInTz(date: Date, timeZone: string): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

function formatTimeInTz(date: Date, timeZone: string): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

/**
 * Parse API datetime strings. If the string has no timezone, assume UTC ('Z').
 */
function parseApiDate(ts: string): Date {
  if (!ts) return new Date(NaN);
  const hasTZ = /[zZ]|[+-]\d\d:?\d\d$/.test(ts);
  return new Date(hasTZ ? ts : ts + 'Z');
}

/**
 * Compute a GMT offset label like "GMT-03:00" for a given IANA time zone.
 */
function gmtOffsetLabel(timeZone: string, at: Date = new Date()): string {
  try {
    const tzDate = new Date(at.toLocaleString('en-US', { timeZone }));
    const offsetMinutes = Math.round((tzDate.getTime() - at.getTime()) / 60000);
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMinutes);
    const hh = String(Math.floor(abs / 60)).padStart(2, '0');
    const mm = String(abs % 60).padStart(2, '0');
    return `GMT${sign}${hh}:${mm}`;
  } catch {
    return 'GMT';
  }
}

// Helpers for computing day bounds in a specific time zone
function makeZonedDate(ymd: string, timeZone: string, h = 0, m = 0, s = 0, ms = 0): Date {
  const [y, mo, d] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d, h, m, s, ms));
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  const offset = utcDate.getTime() - tzDate.getTime();
  return new Date(date.getTime() + offset);
}

function getDayBoundsTz(ymd: string, timeZone: string) {
  const start = makeZonedDate(ymd, timeZone, 0, 0, 0, 0);
  const end = makeZonedDate(ymd, timeZone, 23, 59, 59, 999);
  return { start, end };
}

type Entry = {
  id: string;
  start_time: string;
  end_time?: string | null;
  duration?: number | string | null;
  comment?: string | null;
  timezone?: string | null;
};

export default function Clock() {
  const t = useTranslations();

  const [isClockedIn, setIsClockedIn] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toLocalYMD(new Date()));
  const [viewingTz, setViewingTz] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [openStart, setOpenStart] = useState<Date | null>(null);

  // Editing comment (future use)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentValue, setEditingCommentValue] = useState<string>('');

  // Live elapsed time
  const [liveElapsed, setLiveElapsed] = useState(0);
  useEffect(() => {
    if (openStart) {
      const updateElapsed = () => {
        setLiveElapsed(Math.max(0, (Date.now() - openStart.getTime()) / 3_600_000));
      };
      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    } else {
      setLiveElapsed(0);
    }
  }, [openStart]);

  // Live total time
  const [liveTotal, setLiveTotal] = useState(totalTime);
  useEffect(() => {
    setLiveTotal(totalTime);
    const interval = setInterval(() => {
      setLiveTotal(prev => prev + 1 / 3600); // increment by 1 second
    }, 1000);
    return () => clearInterval(interval);
  }, [totalTime]);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setViewingTz(tz || 'UTC');
    } catch {
      setViewingTz('UTC');
    }
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/entries', { cache: 'no-store' });
      const data: Entry[] = await response.json();

      // Sort newest first
      const sorted = [...data].sort(
        (a, b) => parseApiDate(b.start_time).getTime() - parseApiDate(a.start_time).getTime()
      );
      setEntries(sorted);

      const openEntry = sorted.find((entry) => !entry.end_time);
      setIsClockedIn(!!openEntry);
      setOpenStart(openEntry ? parseApiDate(openEntry.start_time) : null);

      const now = Date.now();
      const totalSeconds = sorted.reduce((acc, entry) => {
        const hasEnded = !!entry.end_time;
        const duration = hasEnded
          ? Number(entry.duration || 0)
          : Math.max(0, (now - new Date(entry.start_time).getTime()) / 1000);
        return acc + duration;
      }, 0);
      setTotalTime(totalSeconds / 3600);
    } catch (e) {
      console.error('Failed to fetch entries', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClock = async () => {
    if (!viewingTz) return;
    await fetch('/api/clock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: comment || null,
        timezone: viewingTz,
      }),
      cache: 'no-store',
    });
    setComment('');
    await fetchStatus();
  };

  const handleCommentEdit = async (id: string, value: string) => {
    await fetch(`/api/entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: value }),
    });
    setEditingCommentId(null);
    setEditingCommentValue('');
    await fetchStatus();
  };

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 60_000); // refresh every minute
    return () => clearInterval(id);
  }, []);

  if (!viewingTz) {
    return (
      <Box>
        <Typography>{t('loading')}</Typography>
      </Box>
    );
  }

  const { start: dayStart, end: dayEnd } = getDayBoundsTz(selectedDate, viewingTz);
  const filteredEntries = entries.filter((e) => {
    const s = parseApiDate(e.start_time);
    const eEnd = e.end_time ? parseApiDate(e.end_time) : new Date();
    const overlapStart = s.getTime() > dayStart.getTime() ? s : dayStart;
    const overlapEnd = eEnd.getTime() < dayEnd.getTime() ? eEnd : dayEnd;
    return overlapEnd.getTime() > overlapStart.getTime();
  });

  return (
    <Stack spacing={3}>
      {/* Clock In/Out */}
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
          <Button
            onClick={handleClock}
            color={isClockedIn ? 'secondary' : 'primary'}
            size="large"
          >
            {isClockedIn ? t('clockOut') : t('clockIn')}
          </Button>
        </Stack>
      </Paper>

      {/* Metrics */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
        <Paper sx={{ p: 2, minWidth: 180, textAlign: 'center' }}>
          <Typography variant="overline" color="primary">
            {t('startedAt')}
          </Typography>
          <Typography variant="h4" sx={{ fontFamily: "'Roboto Mono','Inter',monospace" }}>
            {openStart ? formatTimeInTz(openStart, viewingTz) : '—'}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 180, textAlign: 'center' }}>
          <Typography variant="overline" color="primary">
            Elapsed Time
          </Typography>
          <Typography variant="h4" sx={{ fontFamily: "'Roboto Mono','Inter',monospace" }}>
            {openStart ? formatDurationFromHours(liveElapsed, true) : '—'}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 200, textAlign: 'center' }}>
          <Typography variant="overline" color="primary">
            Total Time Today
          </Typography>
          <Typography variant="h4" sx={{ fontFamily: "'Roboto Mono','Inter',monospace" }}>
            {openStart ? formatDurationFromHours(liveTotal, true) : formatDurationFromHours(totalTime, true)}
          </Typography>
        </Paper>
      </Stack>

      {/* Reports */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
          {t('reports')}
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="center"
          justifyContent="center"
          sx={{ mb: 2 }}
        >
          <TextField
            id="reportDate"
            label={t('date')}
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 200 }}
          />
          <TextField
            id="tz"
            label={t('timezone')}
            value={viewingTz ? `${viewingTz} (${gmtOffsetLabel(viewingTz)})` : ''}
            InputProps={{ readOnly: true }}
            sx={{ minWidth: 260 }}
          />
        </Stack>

        {loading && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={20} sx={{ mr: 1, verticalAlign: 'middle' }} />
            <Typography component="span" color="text.secondary">
              {t('loading')}
            </Typography>
          </Box>
        )}

        {!loading && filteredEntries.length === 0 && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.disabled">{t('noEntries')}</Typography>
          </Box>
        )}

        {!loading && filteredEntries.length > 0 && (
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ textTransform: 'uppercase', fontWeight: 600, color: 'primary.main' }}>
                    {t('start')}
                  </TableCell>
                  <TableCell sx={{ textTransform: 'uppercase', fontWeight: 600, color: 'primary.main' }}>
                    {t('stop')}
                  </TableCell>
                  <TableCell sx={{ textTransform: 'uppercase', fontWeight: 600, color: 'primary.main' }}>
                    {t('hours')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEntries.map((e) => {
                  const start = parseApiDate(e.start_time);
                  const end = e.end_time ? parseApiDate(e.end_time) : new Date();
                  const clampedStart = start.getTime() > dayStart.getTime() ? start : dayStart;
                  const clampedEnd = end.getTime() < dayEnd.getTime() ? end : dayEnd;
                  const seconds = Math.max(0, (clampedEnd.getTime() - clampedStart.getTime()) / 1000);
                  const hours = seconds / 3600;

                  return (
                    <TableRow key={e.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        {formatDateInTz(clampedStart, e.timezone || viewingTz)}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        {e.end_time ? formatDateInTz(clampedEnd, e.timezone || viewingTz) : '—'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {formatDurationFromHours(hours)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
