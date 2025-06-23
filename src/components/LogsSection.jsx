"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { jsPDF } from 'jspdf';
import styles from '../styles/LogsSection.module.css';
import LogsModal from './Modals/LogsModal';
import ConfirmationModal from './Modals/ConfirmationModal';


const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? '/api/proxy' // Use proxy in development
  : '';

const MAX_LOGS = 500; // Maximum number of logs to display

const LogsSection = () => {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(-1);
  const [size] = useState(MAX_LOGS);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [downloadPending, setDownloadPending] = useState(false);
  const logsContainerRef = useRef(null);
  const searchTimeout = useRef(null);

  const searchLogs = (logsText, term) => {
    if (!term || !logsText) return logsText;
    try {
      const query = new RegExp(`.*${term}.*`, 'gim');
      const matches = logsText.match(query);
      return matches ? matches.join('\n') : '';
    } catch (err) {
      console.error('Invalid search pattern:', err);
      return logsText;
    }
  };

  const formatLogs = (logsText) => {
    if (!logsText) return [];
    const filteredLogs = searchTerm ? searchLogs(logsText, searchTerm) : logsText;
    return filteredLogs.split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Extract timestamp if it exists (assuming ISO format at start of line)
        const timestampMatch = line.match(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/);
        if (timestampMatch) {
          const timestamp = new Date(timestampMatch[0]);
          const message = line.substring(timestampMatch[0].length).trim();
          return {
            timestamp,
            message,
            raw: line
          };
        }
        return {
          timestamp: null,
          message: line,
          raw: line
        };
      })
      // Sort by timestamp (newest first) and for lines without timestamp, 
      // keep them in reverse order of appearance
      .reverse()
      .sort((a, b) => {
        if (!a.timestamp && !b.timestamp) return 0;
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return b.timestamp - a.timestamp;
      })
      // Limit to MAX_LOGS entries
      .slice(0, MAX_LOGS);
  };

  const fetchLogs = useCallback(async (newOffset, isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      }
      setError(null);
      

      const response = await fetch(`${API_BASE_URL}/logs?offset=${offset}&size=${size}`, {
      method: 'GET',
      credentials: 'include',
    });

     

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      if (data && data.Status === 1) {
        // Take only the latest MAX_LOGS entries if we have more
        const logLines = data.Logs.split('\n');
        const limitedLogs = logLines.slice(-MAX_LOGS).join('\n');
        
        setLogs(limitedLogs);
        setOffset(data.Offset);

        // Handle scrolling
        if (logsContainerRef.current) {
          setTimeout(() => {
            if (newOffset === -1) {
              logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
            } else {
              logsContainerRef.current.scrollTop = 0;
            }
          }, 100);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.message);
    } finally {
      if (!isAutoRefresh) {
        setLoading(false);
      }
    }
  }, [size]);

  // Initial load
  useEffect(() => {
    fetchLogs(-1);
  }, [fetchLogs]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    let intervalId;
    if (autoRefresh && !showLogsModal) {
      intervalId = setInterval(() => {
        fetchLogs(offset, true);
      }, 10000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, fetchLogs, offset, showLogsModal]);

  // Handle search with debounce
  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      fetchLogs(offset);
    }, 1000);
  };

  const handleStart = () => {
    fetchLogs(0);
  };

  const handlePrev = () => {
    if (offset > 0) {
      fetchLogs(Math.max(0, offset - size));
    }
  };

  const handleNext = () => {
    fetchLogs(offset + size);
  };

  const handleEnd = () => {
    fetchLogs(-1);
  };

  const handleViewFullScreen = () => {
    setShowLogsModal(true);
    // Stop auto-refresh when modal is open
    setAutoRefresh(false);
  };

  const handleCloseModal = () => {
    setShowLogsModal(false);
    // Resume auto-refresh when modal is closed
    setAutoRefresh(true);
  };

  const downloadLatestLogs = async () => {
    setDownloadPending(true);
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/logs?offset=-1&size=100`, {
      method: 'GET',
      credentials: 'include',
    });


      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      if (data && data.Status === 1) {
        // Create PDF
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 10;
        const lineHeight = 7;
        let y = margin;

        // Add title
        pdf.setFontSize(16);
        pdf.text('System Logs', margin, y);
        y += lineHeight * 2;

        // Add timestamp
        pdf.setFontSize(10);
        pdf.text(`Generated on: ${new Date().toLocaleString()}`, margin, y);
        y += lineHeight * 2;

        // Format and add logs
        pdf.setFontSize(8);
        const formattedLogs = formatLogs(data.Logs);
        formattedLogs.forEach((log) => {
          const timestamp = log.timestamp ? log.timestamp.toLocaleString() : '';
          const message = log.message;
          const text = `${timestamp} ${message}`;

          // Split long lines
          const textLines = pdf.splitTextToSize(text, pageWidth - (margin * 2));
          
          // Check if we need a new page
          if (y + (textLines.length * lineHeight) > pdf.internal.pageSize.getHeight() - margin) {
            pdf.addPage();
            y = margin;
          }

          // Add the text lines
          pdf.text(textLines, margin, y);
          y += textLines.length * lineHeight;
        });

        // Download the PDF
        pdf.save(`system_logs_${new Date().toISOString().slice(0,19).replace(/[:]/g, '-')}.pdf`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error downloading logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setDownloadPending(false);
    }
  };

  const formattedLogs = formatLogs(logs);

  return (
    <div className="logs-container d-flex flex-column" style={{ minHeight: 'calc(100vh - 60px)' }}>
      <div className="row justify-content-center">
        <div className="col-12">
          <div style={{ padding: '24px', margin: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-3">
              <div className="d-flex align-items-center gap-2">
                <i className="fas fa-clipboard-list text-primary fs-3 me-2"></i>
                <h2 className="fw-bold mb-0 fs-4">System Logs</h2>
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light"><i className="fas fa-search"></i></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={() => setShowDownloadConfirm(true)}
                  disabled={loading}
                  title="Download Latest 100 Logs"
                >
                  <i className="fas fa-download me-1"></i>
                  Download Latest
                </button>
                <button
                  className={`btn btn-outline-primary btn-sm ${autoRefresh ? 'active' : ''}`}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  title={autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
                >
                  <i className={`fas fa-sync-alt me-1 ${loading && autoRefresh ? 'fa-spin' : ''}`}></i>
                  Auto-refresh
                </button>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={handleViewFullScreen}
                  title="View Full Screen"
                >
                  <i className="fas fa-expand me-1"></i>
                  Full Screen
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => fetchLogs(offset)}
                  disabled={loading}
                  title="Refresh Logs"
                >
                  <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
                </button>
              </div>
            </div>
            <hr className="my-3" />
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
              <span className="badge bg-light text-dark border px-3 py-2">
                Showing latest {formattedLogs.length} logs
              </span>
              <div className="ms-auto d-flex gap-2">
                <button className="btn btn-primary btn-sm" onClick={handleStart} disabled={loading || offset <= 0}>
                  <i className="fas fa-fast-backward me-1"></i>Start
                </button>
                <button className="btn btn-primary btn-sm" onClick={handlePrev} disabled={loading || offset <= 0}>
                  <i className="fas fa-step-backward me-1"></i>Previous
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleNext} disabled={loading}>
                  <i className="fas fa-step-forward me-1"></i>Next
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleEnd} disabled={loading}>
                  <i className="fas fa-fast-forward me-1"></i>End
                </button>
              </div>
            </div>
            <div className="bg-light rounded-3 p-3 shadow-sm" style={{ minHeight: 300, maxHeight: 500, overflowY: 'auto' }}>
              {error ? (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 220 }}>
                  <div style={{
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(220, 53, 69, 0.08)',
                    padding: '32px 24px',
                    maxWidth: '400px',
                    width: '100%',
                    textAlign: 'center',
                    border: '1px solid #f8d7da',
                  }}>
                    <div className="mb-3">
                      <i className="fas fa-exclamation-triangle text-danger" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <h5 className="fw-bold mb-2">Failed to Load Logs</h5>
                    <div className="text-muted mb-3" style={{ fontSize: '1rem' }}>{error}</div>
                    <button
                      className="btn btn-danger btn-sm d-flex align-items-center justify-content-center mx-auto"
                      style={{ minWidth: 110, fontWeight: 500 }}
                      onClick={() => fetchLogs(offset)}
                    >
                      <i className="fas fa-redo-alt me-2" style={{ fontSize: '1rem' }}></i>
                      Try Again
                    </button>
                  </div>
                </div>
              ) : loading && !autoRefresh ? (
                <div className="text-center py-4">
                  <i className="fas fa-spinner fa-spin fa-2x text-primary mb-2"></i>
                  <div>Loading logs...</div>
                </div>
              ) : (
                <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
                  {formattedLogs.map((log, index) => (
                    <div key={index} className="d-flex align-items-start gap-2 py-1 border-bottom border-light-subtle">
                      {log.timestamp && (
                        <span className="text-muted small" style={{ minWidth: 140 }}>
                          {log.timestamp.toLocaleString()}
                        </span>
                      )}
                      <span className="text-dark flex-grow-1">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <LogsModal
        show={showLogsModal}
        onHide={handleCloseModal}
        logs={formattedLogs}
        searchTerm={searchTerm}
        onSearch={handleSearch}
        onStart={handleStart}
        onPrev={handlePrev}
        onNext={handleNext}
        onEnd={handleEnd}
        onDownload={downloadLatestLogs}
      />
      <ConfirmationModal
        show={showDownloadConfirm}
        onHide={() => setShowDownloadConfirm(false)}
        title="Download Latest Logs"
        message={
          <>
            <div className="mb-2">
              This will download the latest 100 logs as a PDF file.<br />
              Are you sure you want to continue?
            </div>
            <div className="small text-muted">File name: <b>system_logs_YYYY-MM-DD_HH-mm-ss.pdf</b></div>
          </>
        }
        onConfirm={() => {
          setShowDownloadConfirm(false);
          downloadLatestLogs();
        }}
        confirmLabel={downloadPending ? 'Downloading...' : 'Download'}
        confirmVariant="primary"
        disabled={downloadPending}
      />
    </div>
  );
};

export default LogsSection;
