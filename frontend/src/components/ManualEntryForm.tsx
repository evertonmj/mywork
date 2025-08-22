import React, { useState } from 'react';

const ManualEntryForm: React.FC = () => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('');
  const [timezone, setTimezone] = useState('');
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const payload: any = {
      start_time: startTime,
      timezone,
      comment,
    };
    if (endTime) payload.end_time = endTime;
    if (duration) payload.duration = parseFloat(duration);
    try {
      const res = await fetch('http://localhost:8001/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMessage('Entry added successfully!');
      } else {
        setMessage('Error adding entry');
      }
    } catch (err) {
      setMessage('Network error');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '2rem auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Manual Time Entry</h2>
      <label>Start Time<br />
        <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} required />
      </label><br /><br />
      <label>End Time<br />
        <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
      </label><br /><br />
      <label>Duration (seconds)<br />
        <input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="0" step="any" />
      </label><br /><br />
      <label>Timezone<br />
        <input type="text" value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="e.g. UTC" />
      </label><br /><br />
      <label>Comment<br />
        <input type="text" value={comment} onChange={e => setComment(e.target.value)} />
      </label><br /><br />
      <button type="submit">Add Entry</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default ManualEntryForm;
