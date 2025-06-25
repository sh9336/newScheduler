'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Modal, Button } from 'react-bootstrap';
import styles from '../../styles/Modals.module.css';
import Notification from '../Notification';

const CHUNK_SIZE = 100 * 1024; // 100KB chunks
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const CONNECTION_TIMEOUT = 10000; // 10 seconds

// Use environment variable or fallback to API route
const BACKEND_WS_URL =  '/newAssetChunkUpload';

const TransferStates = {
  INITED: 'INITED',
  CONNECTING: 'CONNECTING',
  ONGOING: 'ONGOING',
  FINISHED: 'FINISHED',
  ERROR: 'ERROR',
  CLOSED: 'CLOSED',
};

// File name/type validation helpers
const ALLOWED_TYPES = ['audio/mpeg', 'video/mp4'];
const ALLOWED_EXTENSIONS = ['.mp3', '.mp4'];

const isValidFileName = (fileName) => {
  if (fileName.includes(' ')) {
    return {
      isValid: false,
      reason: 'File name contains spaces. Use underscores (_) or dashes (-) instead.'
    };
  }
  const specialCharsRegex = /[!@#$%^&*()+={}[\]|\\/:;"'<>,.?]/;
  if (specialCharsRegex.test(fileName.split('.')[0])) {
    return {
      isValid: false,
      reason: 'File name contains special characters. Only underscores (_) and dashes (-) are allowed.'
    };
  }
  const extension = '.' + fileName.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      reason: `Invalid file extension. Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed.`
    };
  }
  return { isValid: true };
};

const getSchedulerCookie = () => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith('MyScheduler=')) {
      return cookie.split('=')[1];
    }
  }
  return null;
};

const UploadBigAssetModal = ({ show, onHide, onUpload }) => {
  const [files, setFiles] = useState([]);
  const [fileStates, setFileStates] = useState({});
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const activeWebSockets = useRef({});

  const updateFileState = useCallback(
    (filename, state, progress = null, error = null) => {
      setFileStates((prev) => ({
        ...prev,
        [filename]: {
          ...prev[filename],
          state,
          ...(progress !== null && { progress }),
          ...(error !== null && { error }),
        },
      }));
    },
    [],
  );

  const handleServerMessage = useCallback(
    (event, file, ws) => {
      const message = event.data;
      console.log('Received message from server:', message);

      if (message.startsWith('START:')) {
        console.log('Received START from server, sending file info for:', file.name);
        const fileInfo = `FILEINFO:${file.name}:${file.size}:${file.type}`;
        console.log('Sending:', fileInfo);
        ws.send(fileInfo);
        // Ensure bytesTransferred is initialized to 0 on START
        setFileStates((prev) => ({
          ...prev,
          [file.name]: {
            ...prev[file.name],
            state: TransferStates.ONGOING,
            progress: 0,
            bytesTransferred: 0,
          },
        }));
        // Do NOT send any chunk here. Wait for NEXT: from server.
      } else if (message.startsWith('NEXT:')) {
        setFileStates((prev) => {
          const state = prev[file.name];
          if (!state || state.state !== TransferStates.ONGOING) return prev;
          const start = state.bytesTransferred || 0;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          // Only send chunk if there is data left
          if (start < file.size) {
            const reader = new FileReader();
            reader.onload = function (e) {
              try {
                ws.send(e.target.result);
                const newBytesTransferred = end;
                const progress = Math.round((newBytesTransferred / file.size) * 100);
                setFileStates((prev2) => ({
                  ...prev2,
                  [file.name]: {
                    ...prev2[file.name],
                    state: TransferStates.ONGOING,
                    progress,
                    bytesTransferred: newBytesTransferred,
                  },
                }));
                // Only send DONE if this was the last chunk
                if (end === file.size) {
                  console.log('Sending DONE signal for', file.name);
                  ws.send('DONE:');
                }
              } catch (error) {
                console.error('Error sending chunk:', error);
                updateFileState(file.name, TransferStates.ERROR, null, 'Failed to send chunk');
                ws.close();
                Notification({
                  message: `Error uploading ${file.name}: Failed to send chunk`,
                  type: 'error',
                });
              }
            };
            reader.readAsArrayBuffer(chunk);
          } else {
            // If somehow NEXT: is received after all data sent, do not send DONE again
            console.warn('Received NEXT: after all data sent for', file.name);
          }
          return prev;
        });
      } else if (message.startsWith('UPLOADED:')) {
        // Accept any UPLOADED: message as success, regardless of regex match or file name
        Object.keys(fileStates).forEach((fname) => {
          if (fileStates[fname].state !== TransferStates.FINISHED) {
            updateFileState(fname, TransferStates.FINISHED, 100);
          }
        });
        // Prevent retry logic after a successful upload
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.onclose = null; // Prevent triggering retry logic
          ws.close();
        }
        onUpload?.();
        Notification({
          message: `File uploaded successfully`,
          type: 'success',
        });
        // Automatically close the modal after a short delay
        setTimeout(() => {
          if (typeof onHide === 'function') onHide();
          // Clear files and fileStates for next upload
          setFiles([]);
          setFileStates({});
        }, 1200);
        return;
      } else if (message.startsWith('ERROR:')) {
        const error = message.substring(6);
        console.error(`Server error for ${file.name}:`, error);
        updateFileState(file.name, TransferStates.ERROR, null, error);
        ws.close();
        Notification({
          message: `Error uploading ${file.name}: ${error}`,
          type: 'error',
        });
      }
    },
    [fileStates, onUpload, updateFileState],
  );

  const startUpload = useCallback(
    async (file) => {
      if (activeWebSockets.current[file.name]) {
        activeWebSockets.current[file.name].close();
      }

      let retryCount = 0;

      const tryConnect = async () => {
        let ws = null;

        try {
          updateFileState(file.name, TransferStates.CONNECTING, 0);

          console.log('Attempting WebSocket connection to:', BACKEND_WS_URL);

          ws = new WebSocket(BACKEND_WS_URL);
          ws.binaryType = 'arraybuffer';

          ws.onopen = () => {
            console.log('WebSocket connection opened. ReadyState:', ws.readyState);
          };

          ws.onerror = (event) => {
            console.error('WebSocket error event:', {
              type: event.type,
              target: {
                url: event.target.url,
                readyState: event.target.readyState,
                bufferedAmount: event.target.bufferedAmount,
                protocol: event.target.protocol,
                extensions: event.target.extensions,
              },
            });
          };

          const connectionTimeout = setTimeout(() => {
            if (ws && ws.readyState !== WebSocket.OPEN) {
              console.error('Connection timeout. Current readyState:', ws.readyState);
              ws.close();
              // Remove retry logic: do not retry on timeout
            }
          }, CONNECTION_TIMEOUT);

          await new Promise((resolve, reject) => {
            let hasErrored = false;

            const handleOpen = () => {
              clearTimeout(connectionTimeout);
              ws.removeEventListener('open', handleOpen);
              ws.removeEventListener('error', handleError);
              console.log('WebSocket connection established successfully');
              resolve();
            };

            const handleError = (error) => {
              if (hasErrored) return;
              hasErrored = true;

              clearTimeout(connectionTimeout);
              ws.removeEventListener('open', handleOpen);
              ws.removeEventListener('error', handleError);

              console.error('WebSocket connection failed:', {
                wsState: ws.readyState,
                wsUrl: ws.url,
                error: error,
              });

              reject(new Error('Failed to establish WebSocket connection'));
            };

            ws.addEventListener('open', handleOpen);
            ws.addEventListener('error', handleError);
          });

          activeWebSockets.current[file.name] = ws;

          ws.onmessage = (event) => {
            console.log('Received message type:', typeof event.data);
            handleServerMessage(event, file, ws);
          };

          ws.onerror = (error) => {
            console.error('WebSocket error during transfer:', {
              readyState: ws.readyState,
              error: error,
            });
            updateFileState(file.name, TransferStates.ERROR, null, 'Connection error during transfer');
            Notification({
              message: `Error uploading ${file.name}: Connection error`,
              type: 'error',
            });
          };

          ws.onclose = (event) => {
            console.log('WebSocket connection closed:', {
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean,
              readyState: ws.readyState,
            });

            delete activeWebSockets.current[file.name];

            if (event.code !== 1000) {
              let errorMsg;
              switch (event.code) {
                case 1006:
                  errorMsg = 'Connection closed abnormally - possible CORS or network issue';
                  break;
                case 1015:
                  errorMsg = 'TLS handshake failed';
                  break;
                case 1008:
                  errorMsg = 'Authentication required - please log in first';
                  break;
                default:
                  errorMsg = event.reason || 'Connection closed unexpectedly';
              }

              updateFileState(file.name, TransferStates.ERROR, null, errorMsg);

              if (event.code === 1008) {
                Notification({
                  message: 'Please log in to upload files',
                  type: 'error',
                });
                return;
              }

              // Remove retry logic: do not retry on close
              Notification({
                message: `Failed to upload ${file.name}: ${errorMsg}`,
                type: 'error',
              });
            }
          };

          setFileStates((prev) => ({
            ...prev,
            [file.name]: {
              file,
              state: TransferStates.CONNECTING,
              progress: 0,
              bytesTransferred: 0,
            },
          }));
        } catch (error) {
          console.error('Failed to start upload:', {
            error: error,
            message: error.message,
            stack: error.stack,
          });

          updateFileState(file.name, TransferStates.ERROR, null, error.message);

          if (ws) {
            try {
              ws.close();
            } catch (closeError) {
              console.error('Error closing WebSocket:', closeError);
            }
          }

          // Remove retry logic: do not retry on error
          Notification({
            message: `Failed to upload ${file.name}: ${error.message}`,
            type: 'error',
          });
        }
      };

      await tryConnect();
    },
    [handleServerMessage, updateFileState],
  );

  // Validation function for files before upload
  const validateFiles = (fileList) => {
    const validFiles = [];
    const invalidFiles = [];
    Array.from(fileList).forEach(file => {
      const fileNameValidation = isValidFileName(file.name);
      if (!fileNameValidation.isValid) {
        invalidFiles.push({
          name: file.name,
          reason: fileNameValidation.reason
        });
      } else if (!ALLOWED_TYPES.includes(file.type)) {
        invalidFiles.push({
          name: file.name,
          reason: 'Invalid file type. Only MP3 and MP4 files are allowed.'
        });
      } else {
        validFiles.push(file);
      }
    });
    if (invalidFiles.length > 0) {
      const message = invalidFiles.map(file => `"${file.name}": ${file.reason}`).join('\n');
      Notification({ message: 'Invalid Files:\n' + message, type: 'warning' });
    }
    return validFiles;
  };

  const handleFileSelect = useCallback(
    (event) => {
      const selectedFiles = Array.from(event.target.files || []);
      const validFiles = validateFiles(selectedFiles);
      setFiles((prev) => [...prev, ...validFiles]);
      validFiles.forEach((file) => {
        if (!fileStates[file.name]) {
          startUpload(file);
        }
      });
    },
    [fileStates, startUpload],
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files || []);
      const validFiles = validateFiles(droppedFiles);
      setFiles((prev) => [...prev, ...validFiles]);
      validFiles.forEach((file) => {
        if (!fileStates[file.name]) {
          startUpload(file);
        }
      });
    },
    [fileStates, startUpload],
  );

  const closeModal = useCallback(() => {
    Object.values(activeWebSockets.current).forEach((ws) => ws.close());
    activeWebSockets.current = {};
    setFiles([]);
    setFileStates({});
    onHide();
  }, [onHide]);

  if (!show) return null;

  return (
    <Modal show={show} onHide={closeModal} centered size="md" className="fade" backdrop="static">
      <Modal.Header closeButton className="bg-light border-bottom-0 px-3 py-2">
        <Modal.Title className="d-flex align-items-center fs-5">
          <i className="fas fa-cloud-upload-alt text-primary me-2"></i>
          <span className="fw-semibold">Upload Large Assets</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-3">
        <div className="alert alert-info py-2 px-3 mb-3">
          <h6 className="fw-bold mb-1 fs-6">File Requirements:</h6>
          <ul className="mb-0 ps-3 small">
            <li>Only MP3(.mp3) and MP4(.mp4) files are supported</li>
            <li>File names must not contain spaces or special characters</li>
            <li>Use underscores (_) or dashes (-) instead of spaces</li>
            <li>Example: my_song.mp3, track-name.mp4</li>
            <li>Large files will be uploaded in chunks</li>
            <li>Single file upload at a time is supported.</li>
          </ul>
        </div>
        <div
          className="border-2 border-dashed rounded-3 p-4 text-center mb-3 bg-light hover-bg-primary-subtle transition-all"
          style={{ cursor: 'pointer', borderStyle: 'dashed', borderWidth: '2px', borderColor: '#dee2e6', transition: 'all 0.3s ease' }}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.borderColor = '#0d6efd'; e.currentTarget.style.backgroundColor = '#f8f9fa'; setIsDragOver(true); }}
          onDragLeave={e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.style.borderColor = '#dee2e6'; e.currentTarget.style.backgroundColor = '#f8f9fa'; setIsDragOver(false); }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="d-none"
            accept=".mp3,.mp4"
          />
          <div className="py-3">
            <div className="upload-icon-wrapper mb-2">
              <i className="fas fa-cloud-upload-alt text-primary" style={{ fontSize: '2.5rem' }}></i>
            </div>
            <p className="fw-semibold mb-1">Drop your files here</p>
            <p className="text-muted mb-0 small">
              or <span className="text-primary text-decoration-underline">browse</span> to choose files
            </p>
            <small className="d-block text-muted mt-1 small">
              Supported formats: MP3, MP4
            </small>
          </div>
        </div>
        {Object.keys(fileStates).length > 0 && (
          <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-semibold mb-0 fs-6">Selected Files</h6>
              <small className="text-muted">{Object.keys(fileStates).length} file(s)</small>
            </div>
            <div className="list-group shadow-sm" style={{ maxHeight: '200px', overflowY: 'auto', overflowX: 'hidden' }}>
              {Object.entries(fileStates).map(([filename, state]) => (
                <div key={filename} className="list-group-item border-0 rounded-2 mb-1 bg-light-subtle py-2 px-3">
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center flex-grow-1 min-width-0">
                      <div className="file-icon rounded-circle bg-primary bg-opacity-10 p-1 me-2">
                        <i className="fas fa-file text-primary small"></i>
                      </div>
                      <div className="flex-grow-1 min-width-0">
                        <p className="fw-medium mb-0 text-truncate small">{filename}</p>
                        <div className="d-flex align-items-center">
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {state.file ? (state.file.size / (1024 * 1024)).toFixed(2) : '--'} MB
                          </small>
                          {state.state === 'FINISHED' && (
                            <span className="badge bg-success ms-2" style={{ fontSize: '0.7rem' }}>Completed</span>
                          )}
                          {state.state === 'ERROR' && (
                            <span className="badge bg-danger ms-2" style={{ fontSize: '0.7rem' }}>Failed</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2" style={{ width: '35%' }}>
                      <div className="flex-grow-1">
                        <div className="progress rounded-pill" style={{ height: '11px' }}>
                          <div
                            className={`progress-bar ${state.state === 'ERROR' ? 'bg-danger' : state.state === 'FINISHED' ? 'bg-success' : 'bg-primary'}`}
                            role="progressbar"
                            style={{ width: `${state.progress || 0}%` }}
                            aria-valuenow={state.progress || 0}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <span style={{ fontSize: '0.7rem' }}>{state.progress || 0}%</span>
                          </div>
                        </div>
                      </div>
                      {state.state !== 'ONGOING' && state.state !== 'FINISHED' && (
                        <button
                          className="btn btn-link text-danger p-0 ms-1"
                          onClick={() => {/* remove file logic if needed */}}
                          title="Remove file"
                          style={{ fontSize: '0.875rem' }}
                        >
                          <i className="fas fa-times-circle"></i>
                        </button>
                      )}
                      {state.state === 'ERROR' && (
                        <button
                          className="btn btn-link text-warning p-0 ms-1"
                          onClick={() => startUpload(state.file)}
                          title="Retry upload"
                          style={{ fontSize: '0.875rem' }}
                        >
                          <i className="fas fa-redo"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-top-0 px-3 pb-3 pt-0" style={{ justifyContent: 'center', gap: 12 }}>
        <Button variant="light" onClick={closeModal} className="rounded-2 px-3" size="sm">
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UploadBigAssetModal;