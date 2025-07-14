import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [highlightPath, setHighlightPath] = useState('');
  const [subtitlePath, setSubtitlePath] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState('');

  const [steps, setSteps] = useState([
    { label: 'Summarizing...', key: 'summarize', status: 'pending' },
    { label: 'Transcribing...', key: 'transcribe', status: 'pending' },
    { label: 'Generating highlight...', key: 'highlight', status: 'pending' }
  ]);

  const handleDownload = async () => {
    setLoading('Downloading video...');
    await axios.post('https://community-highlighter-backend-production.up.railway.app/api/download', { url });
    setLoading('');
    alert('Download complete');
    fetchMetadata();
  };

  const handleUpload = async () => {
    if (!file) return alert('No file selected');
    const formData = new FormData();
    formData.append('video', file);
    setLoading('Uploading video...');
    await axios.post('https://community-highlighter-backend-production.up.railway.app/api/upload', formData);
    setLoading('');
    alert('Upload complete');
    fetchMetadata();
  };

  const handleSummarize = async () => {
    setLoading('Summarizing...');
    const res = await axios.post('https://community-highlighter-backend-production.up.railway.app/api/summarize');
    setSummary(res.data.summary);
    setLoading('');
  };

  const handleHighlight = async () => {
    setLoading('Generating highlight...');
    const res = await axios.post('https://community-highlighter-backend-production.up.railway.app/api/highlight');
    setHighlightPath(res.data.path);
    setLoading('');
  };

  const handleTranscribe = async () => {
    setLoading('Transcribing subtitles...');
    const res = await axios.post('https://community-highlighter-backend-production.up.railway.app/api/transcribe');
    setSubtitlePath(res.data.path);
    setLoading('');
  };

  const handleAll = async () => {
    const initialSteps = [
      { label: 'Summarizing...', key: 'summarize', status: 'pending' },
      { label: 'Transcribing...', key: 'transcribe', status: 'pending' },
      { label: 'Generating highlight...', key: 'highlight', status: 'pending' }
    ];
    setSteps(initialSteps);
    setLoading('Running full analysis...');

    try {
      const updatedSteps = [...initialSteps];

      updatedSteps[0].status = 'working';
      setSteps([...updatedSteps]);
      const sum = await axios.post('https://community-highlighter-backend-production.up.railway.app/api/summarize');
      setSummary(sum.data.summary);
      updatedSteps[0].status = 'done';
      setSteps([...updatedSteps]);

      updatedSteps[1].status = 'working';
      setSteps([...updatedSteps]);
      const sub = await axios.post('https://community-highlighter-backend-production.up.railway.app/api/transcribe');
      setSubtitlePath(sub.data.path);
      updatedSteps[1].status = 'done';
      setSteps([...updatedSteps]);

      updatedSteps[2].status = 'working';
      setSteps([...updatedSteps]);
      const high = await axios.post('https://community-highlighter-backend-production.up.railway.app/api/highlight');
      setHighlightPath(high.data.path);
      updatedSteps[2].status = 'done';
      setSteps([...updatedSteps]);

      fetchMetadata();
      setLoading('');
    } catch (err) {
      console.error(err);
      setLoading('');
      alert('Error occurred. See console.');
    }
  };

  const fetchMetadata = async () => {
    const res = await axios.get('https://community-highlighter-backend-production.up.railway.app/api/metadata');
    setMetadata(res.data);
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <h1 style={styles.heading}>
          🎥 Community <span style={styles.highlight}>Highlighter</span>
        </h1>

        <div style={styles.section}>
          <input
            type="text"
            placeholder="Paste YouTube link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleDownload} disabled={!!loading} style={styles.button}>Download Video</button>
        </div>

        <div style={styles.section}>
          <input
            type="file"
            accept="video/mp4"
            onChange={(e) => setFile(e.target.files[0])}
            style={styles.input}
          />
          <button onClick={handleUpload} disabled={!!loading} style={styles.button}>Upload Local File</button>
        </div>

        <div style={styles.section}>
          <button onClick={handleSummarize} disabled={!!loading} style={styles.actionButton}>Summarize</button>
          <button onClick={handleHighlight} disabled={!!loading} style={styles.actionButton}>Highlight</button>
          <button onClick={handleTranscribe} disabled={!!loading} style={styles.actionButton}>Subtitles</button>
        </div>

        <div style={styles.section}>
          <button onClick={handleAll} disabled={!!loading} style={styles.allButton}>
            ⚡ Run All Steps
          </button>
        </div>

        {loading && (
          <div style={styles.progressBox}>
            <div style={styles.progressBarOuter}>
              <div style={{
                ...styles.progressBarInner,
                width: `${(steps.filter(s => s.status === 'done').length / steps.length) * 100}%`
              }}></div>
            </div>
            <ul style={styles.progressList}>
              {steps.map((step, idx) => (
                <li key={idx}>
                  {step.status === 'done' && '✅ '}
                  {step.status === 'working' && '🔄 '}
                  {step.status === 'pending' && '⬜ '}
                  {step.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {metadata && (
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Video Info</h2>
            <ul style={styles.metaList}>
              <li>⏱ Duration: {metadata.duration_minutes} min</li>
              <li>📐 Resolution: {metadata.width}×{metadata.height}</li>
              <li>🎞 FPS: {metadata.fps}</li>
              <li>📦 Size: {metadata.file_size_mb} MB</li>
            </ul>
          </div>
        )}

        {summary && (
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Summary</h2>
            <pre style={styles.pre}>{summary}</pre>
          </div>
        )}

        {highlightPath && (
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Highlight Reel</h2>
            <video src={`https://community-highlighter-backend-production.up.railway.app${highlightPath}`} controls width="100%" />
            <a href={`https://community-highlighter-backend-production.up.railway.app${highlightPath}`} download style={styles.link}>⬇ Download Highlight</a>
          </div>
        )}

        {subtitlePath && (
          <div style={styles.card}>
            <h2 style={styles.subtitle}>Subtitles</h2>
            <a href={`https://community-highlighter-backend-production.up.railway.app${subtitlePath}`} download style={styles.link}>⬇ Download Subtitles (.srt)</a>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  body: {
    backgroundColor: '#e9f2f0',
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    minHeight: '100vh',
    padding: 40,
  },
  container: {
    maxWidth: 760,
    margin: '0 auto',
    background: '#fff',
    padding: 40,
    borderRadius: 12,
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
  heading: {
    textAlign: 'center',
    fontSize: 32,
    marginBottom: 30,
    color: '#2c5f5c',
  },
  highlight: {
    backgroundColor: '#fff59d',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  section: {
    marginBottom: 25,
    display: 'flex',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    fontSize: 16,
    borderRadius: 6,
    border: '1px solid #ccc',
    marginRight: 12,
  },
  button: {
    padding: '12px 20px',
    fontSize: 16,
    borderRadius: 6,
    border: 'none',
    backgroundColor: '#2c5f5c',
    color: '#fff',
    cursor: 'pointer'
  },
  actionButton: {
    flex: 1,
    padding: '14px 0',
    fontSize: 18,
    margin: '0 6px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#3a7d7a',
    color: '#fff',
    cursor: 'pointer'
  },
  allButton: {
    width: '100%',
    padding: '16px 0',
    fontSize: 18,
    backgroundColor: '#f5a623',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    marginTop: 10
  },
  loading: {
    color: '#555',
    marginTop: 10,
    textAlign: 'center'
  },
  card: {
    background: '#fdfdfd',
    padding: 24,
    borderRadius: 10,
    marginTop: 35,
    border: '1px solid #dde2e2'
  },
  subtitle: {
    marginBottom: 12,
    fontSize: 24,
    color: '#2c5f5c'
  },
  metaList: {
    listStyle: 'none',
    paddingLeft: 0,
    lineHeight: '1.8em'
  },
  pre: {
    background: '#fafafa',
    padding: 18,
    borderRadius: 8,
    whiteSpace: 'pre-wrap',
    fontSize: 16,
    color: '#333'
  },
  link: {
    display: 'inline-block',
    marginTop: 12,
    fontSize: 16,
    textDecoration: 'none',
    color: '#2c5f5c'
  },
  progressBox: {
    marginTop: 20,
    padding: 15,
    background: '#fdfaf0',
    border: '1px solid #eee',
    borderRadius: 8
  },
  progressBarOuter: {
    height: 10,
    backgroundColor: '#ddd',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10
  },
  progressBarInner: {
    height: 10,
    backgroundColor: '#f5a623',
    transition: 'width 0.4s ease'
  },
  progressList: {
    listStyle: 'none',
    paddingLeft: 0,
    lineHeight: '1.8em',
    fontSize: 14
  }
};

export default App;