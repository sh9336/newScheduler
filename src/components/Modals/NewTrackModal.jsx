'use client';

import { useState, useRef, useEffect } from 'react';
import { Modal, Button, ProgressBar } from 'react-bootstrap';
import styles from '../../styles/Modals.module.css';
import Notification from '../Notification';

const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? '/api/proxy' // Use proxy in development
  : '';

export default function NewTrackModal({ show, onHide, onCreate }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const ALLOWED_TYPES = ['audio/mpeg', 'video/mp4', 'audio/x-scpls'];
  const ALLOWED_EXTENSIONS = ['.mp3', '.mp4', '.pls'];
  
  // Function to validate file name
  const isValidFileName = (fileName) => {
    // Check for spaces
    if (fileName.includes(' ')) {
      return {
        isValid: false,
        reason: 'File name contains spaces. Use underscores (_) or dashes (-) instead.'
      };
    }

    // Check for special characters (except underscore and dash)
    const specialCharsRegex = /[!@#$%^&*()+={}\[\]|\\/:;"'<>,.?]/;
    if (specialCharsRegex.test(fileName.split('.')[0])) {
      return {
        isValid: false,
        reason: 'File name contains special characters. Only underscores (_) and dashes (-) are allowed.'
      };
    }

    // Check file extension
    const extension = '.' + fileName.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        reason: `Invalid file extension. Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed.`
      };
    }

    return { isValid: true };
  };

  // Function to suggest valid filename
  const suggestValidFileName = (fileName) => {
    const nameWithoutExt = fileName.split('.')[0];
    const extension = '.' + fileName.split('.').pop().toLowerCase();
    
    // Replace spaces and special chars with underscore
    let validName = nameWithoutExt
      .replace(/\s+/g, '_') // Replace spaces with underscore
      .replace(/[!@#$%^&*()+={}\[\]|\\/:;"'<>,.?]/g, '_') // Replace special chars with underscore
      .replace(/_+/g, '_'); // Replace multiple underscores with single underscore
    
    return validName + extension;
  };

  // Function to filter and validate files
  const filterValidFiles = (fileList) => {
    const validFiles = [];
    const invalidFiles = [];

    Array.from(fileList).forEach(file => {
      const fileNameValidation = isValidFileName(file.name);
      
      if (!fileNameValidation.isValid) {
        invalidFiles.push({
          name: file.name,
          reason: fileNameValidation.reason,
          suggestion: suggestValidFileName(file.name)
        });
      } else if (!ALLOWED_TYPES.includes(file.type) && file.name.split('.').pop().toLowerCase() !== 'pls') {
        invalidFiles.push({
          name: file.name,
          reason: 'Invalid file type. Only MP3, MP4, and Playlist(.pls) files are allowed.',
          suggestion: null
        });
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      const message = invalidFiles.map(file => {
        let msg = `"${file.name}": ${file.reason}`;
        if (file.suggestion) {
          msg += `\nSuggested name: ${file.suggestion}`;
        }
        return msg;
      }).join('\n\n');

      Notification({
        message: 'Invalid Files:\n' + message,
        type: 'warning'
      });
    }

    return validFiles;
  };

  // Reset all states when modal is closed
  useEffect(() => {
    if (!show) {
      resetStates();
    }
  }, [show]);

  // Function to reset all states
  const resetStates = () => {
    setFiles([]);
    setUploadProgress({});
    setUploadStatus({});
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Modified handleClose function
  const handleClose = () => {
    resetStates();
    onHide();
  };

  const handleFileSelect = (e) => {
    const validFiles = filterValidFiles(e.target.files);
    if (validFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
      // Initialize upload status for new files
      const newStatus = {};
      validFiles.forEach(file => {
        newStatus[file.name] = 'pending'; // pending, uploading, completed, error
      });
      setUploadStatus(prev => ({ ...prev, ...newStatus }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current.classList.add('bg-light');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current.classList.remove('bg-light');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.borderColor = '#dee2e6';
    e.currentTarget.style.backgroundColor = '#f8f9fa';
    
    const validFiles = filterValidFiles(e.dataTransfer.files);
    if (validFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
      // Initialize upload status for dropped files
      const newStatus = {};
      validFiles.forEach(file => {
        newStatus[file.name] = 'pending';
      });
      setUploadStatus(prev => ({ ...prev, ...newStatus }));
    }
  };

  const removeFile = (file) => {
    setFiles(prevFiles => prevFiles.filter(f => f.name !== file.name));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[file.name];
      return newProgress;
    });
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[file.name];
      return newStatus;
    });
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('File', file);
    formData.append('FileName', file.name);

    try {
      setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: progress
          }));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));
          setUploadStatus(prev => ({ ...prev, [file.name]: 'completed' }));
        } else {
          throw new Error('Upload failed');
        }
      };

      xhr.onerror = () => {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
        throw new Error('Upload failed');
      };

      // xhr.open('POST', '/api/newAsset', true);
      // xhr.withCredentials = true;
      xhr.open('POST', `${API_BASE_URL}/newAsset`, true);
      xhr.withCredentials = true; // Send cookies
      xhr.send(formData);

      return new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => {
          setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
          reject(new Error('Upload failed'));
        };
      });
    } catch (error) {
      console.error(`Error uploading ${file.name}:`, error);
      setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
      throw error;
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      Notification({ message: 'Please select files to upload', type: 'warning' });
      return;
    }

    setUploading(true);
    let hasError = false;

    try {
      // Upload files sequentially to prevent overwhelming the server
      for (const file of files) {
        try {
          await uploadFile(file);
        } catch (error) {
          hasError = true;
          Notification({ 
            message: `Error uploading ${file.name}`, 
            type: 'danger' 
          });
        }
      }

      if (!hasError) {
        Notification({ message: 'All files uploaded successfully', type: 'success' });
        onCreate();
        resetStates(); // Reset states before closing
        onHide();
      }
    } catch (error) {
      console.error('Error in upload process:', error);
    } finally {
      setUploading(false);
    }
  };

  const getProgressVariant = (fileName) => {
    switch (uploadStatus[fileName]) {
      case 'completed':
        return 'success';
      case 'error':
        return 'danger';
      case 'uploading':
        return 'primary';
      default:
        return 'secondary';
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose}
      centered 
      size="md"
      className="fade"
      backdrop="static"
    >
      <Modal.Header closeButton className="bg-light border-bottom-0 px-3 py-2">
        <Modal.Title className="d-flex align-items-center fs-5">
          <i className="fas fa-cloud-upload-alt text-primary me-2"></i>
          <span className="fw-semibold">Upload Tracks</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-3">
        <div className="alert alert-info py-2 px-3 mb-3">
          <h6 className="fw-bold mb-1 fs-6">File Requirements:</h6>
          <ul className="mb-0 ps-3 small">
            <li>Only MP3(.mp3), MP4(.mp4) & Playlist(.pls) files are supported</li>
            <li>File names must not contain spaces or special characters</li>
            <li>Use underscores (_) or dashes (-) instead of spaces</li>
            <li>Example: my_song.mp3, track-name.mp4</li>
            <li>Multiple file upload supported.</li>
            <li>File size must be less than 1.4 GB, if more choose Large File Upload option</li>
          </ul>
        </div>

        <div
          ref={dropZoneRef}
          className="border-2 border-dashed rounded-3 p-4 text-center mb-3 bg-light hover-bg-primary-subtle transition-all"
          style={{ 
            cursor: 'pointer',
            borderStyle: 'dashed',
            borderWidth: '2px',
            borderColor: '#dee2e6',
            transition: 'all 0.3s ease'
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.style.borderColor = '#0d6efd';
            e.currentTarget.style.backgroundColor = '#f8f9fa';
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.style.borderColor = '#dee2e6';
            e.currentTarget.style.backgroundColor = '#f8f9fa';
          }}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="d-none"
            onChange={handleFileSelect}
            multiple
            accept=".mp3,.mp4,.pls"
          />
          <div className="py-3">
            <div className="upload-icon-wrapper mb-2">
              <i className="fas fa-cloud-upload-alt text-primary" 
                 style={{ fontSize: '2.5rem' }}></i>
            </div>
            <p className="fw-semibold mb-1">Drop your files here</p>
            <p className="text-muted mb-0 small">
              or <span className="text-primary text-decoration-underline">browse</span> to choose files
            </p>
            <small className="d-block text-muted mt-1 small">
              Supported formats: MP3, MP4 & Playlist(.pls)
            </small>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-semibold mb-0 fs-6">Selected Files</h6>
              <small className="text-muted">{files.length} file(s)</small>
            </div>
            <div 
              className="list-group shadow-sm" 
              style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                overflowX: 'hidden'
              }}
            >
              {files.map((file) => (
                <div 
                  key={file.name} 
                  className="list-group-item border-0 rounded-2 mb-1 bg-light-subtle py-2 px-3"
                >
                  <div className="d-flex align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center flex-grow-1 min-width-0">
                      <div className="file-icon rounded-circle bg-primary bg-opacity-10 p-1 me-2">
                        <i className="fas fa-file-audio text-primary small"></i>
                      </div>
                      <div className="flex-grow-1 min-width-0">
                        <p className="fw-medium mb-0 text-truncate small">
                          {file.name}
                        </p>
                        <div className="d-flex align-items-center">
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </small>
                          {uploadStatus[file.name] === 'completed' && (
                            <span className="badge bg-success ms-2" style={{ fontSize: '0.7rem' }}>Completed</span>
                          )}
                          {uploadStatus[file.name] === 'error' && (
                            <span className="badge bg-danger ms-2" style={{ fontSize: '0.7rem' }}>Failed</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2" style={{ width: '35%' }}>
                      <div className="flex-grow-1">
                        <ProgressBar 
                          now={uploadProgress[file.name] || 0} 
                          label={
                            <span style={{ fontSize: '0.7rem' }}>
                              {uploadProgress[file.name] || 0}%
                            </span>
                          }
                          variant={getProgressVariant(file.name)}
                          animated={uploadStatus[file.name] === 'uploading'}
                          striped
                          style={{ height: '11px' }}
                          className="rounded-pill"
                        />
                      </div>
                      {uploadStatus[file.name] !== 'uploading' && (
                        <button
                          className="btn btn-link text-danger p-0 ms-1"
                          onClick={() => removeFile(file)}
                          disabled={uploading}
                          title="Remove file"
                          style={{ fontSize: '0.875rem' }}
                        >
                          <i className="fas fa-times-circle"></i>
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
      <Modal.Footer className="border-top-0 px-3 pb-3 pt-0">
        <Button 
          variant="light" 
          onClick={handleClose}
          disabled={uploading}
          className="rounded-2 px-3"
          size="sm"
        >
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleUpload} 
          disabled={uploading || files.length === 0}
          className="rounded-2 px-3 ms-2"
          size="sm"
        >
          {uploading ? (
            <>
              <span 
                className="spinner-border spinner-border-sm me-1" 
                role="status" 
                aria-hidden="true"
                style={{ width: '0.8rem', height: '0.8rem' }}
              ></span>
              Uploading...
            </>
          ) : (
            <>
              <i className="fas fa-upload me-1"></i>
              Upload Files
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
