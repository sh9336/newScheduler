"use client";

import { useState, useEffect } from 'react';
import FloatingNotification from './FloatingNotification';
import styles from '../styles/StatusSection.module.css';

    // Base URL for API
const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? '/api/proxy' // Use proxy in development
  : ''; // Direct backend in production

export default function StatusSection() {
  const [statusData, setStatusData] = useState({
    runningActionSchedules: {},
    lastExecutedActionSchedules: {},
    upcomingActionSchedules: {},
    currentTimeUnix: '',
    systemVersion: '',
    assets: [],
    schedules: [],
    scheduleActions: [],
    Ports: []
  });
  const [playingItems, setPlayingItems] = useState(new Set()); // Track playing items

  const [schedulerTime, setSchedulerTime] = useState('');
  const [displayTime, setDisplayTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [schedulerStatus, setSchedulerStatus] = useState('online'); // New state for scheduler status

  // Function to fetch time only
  const fetchSchedulerTime = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/initWithTime`, {
        method: 'GET',
        credentials: 'include', // Send cookies
      });

      if (!response.ok) {
        if (response.status === 401) {
          setSchedulerStatus('not-authenticated');
          throw new Error('Not authenticated');
        }
        throw new Error('Failed to fetch status');
      }
      const data = await response.json();
      setSchedulerTime(data.currentTimeUnix);
      setDisplayTime(data.currentTimeUnix);
      setSchedulerStatus('online');
    } catch (error) {
      console.error('Error fetching scheduler time:', error);
      setSchedulerStatus('offline');
    }
  };

  // Effect for time update every second using browser time
  useEffect(() => {
    fetchSchedulerTime(); // Initial fetch
    const timeInterval = setInterval(() => {
      const now = new Date();
      setDisplayTime(now.toISOString());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Effect for full status update and scheduler time sync every 5 seconds
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/initWithTime`, {
          method: 'GET',
          credentials: 'include', // Send cookies
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setSchedulerStatus('not-authenticated');
            showNotification('No valid session or session expired. Please login again.', 'warning');
            localStorage.removeItem('isAuthenticated');
            window.location.href = '/static/login.html';
            return;
          }
          throw new Error('Failed to fetch status');
        }
        const data = await response.json();
        setStatusData({
          ...data,
          systemVersion: data.SystemInfo?.SystemVersion || ''
        });
        setSchedulerTime(data.currentTimeUnix);
        setDisplayTime(data.currentTimeUnix);
        setSchedulerStatus('online');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching status:', error);
        setSchedulerStatus('offline');
        setLoading(false);
      }
    };

    loadStatus();
    const statusInterval = setInterval(loadStatus, 5000);
    return () => clearInterval(statusInterval);
  }, []);

  // Update playingItems whenever runningActionSchedules changes
  useEffect(() => {
    const runningItems = Object.values(statusData.runningActionSchedules).map(item => 
      isTrack(item) ? item.AssetId : item.ScheduleId
    );
    setPlayingItems(new Set(runningItems));
  }, [statusData.runningActionSchedules]);

  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const isTrack = (item) => {
    return item.Name === '[[ManualPlay]]';
  };

 const handleScheduleAction = async (action, scheduleId) => {
  try {
    let response;

    const formData = new FormData();
    formData.append('scheduleId', scheduleId);

    if (action === 'play') {
      response = await fetch(`${API_BASE_URL}/start_sch_now`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Send cookies
      });
    } else {
      response = await fetch(`${API_BASE_URL}/stop_sch_now`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Send cookies
      });
    }

    if (!response.ok) {
      if (response.status === 401) {
        setSchedulerStatus('not-authenticated');
        throw new Error('Not authenticated');
      }
      throw new Error(`Failed to ${action} schedule`);
    }

    // Update playing items state
    setPlayingItems(prev => {
      const newSet = new Set(prev);
      if (action === 'play') {
        newSet.add(scheduleId);
      } else {
        newSet.delete(scheduleId);
      }
      return newSet;
    });

    showNotification(
      `${action === 'play' ? 'Started' : 'Stopped'} schedule successfully`,
      'success'
    );
  } catch (error) {
    console.error('Error in schedule action:', error);
    showNotification(
      `Error ${action === 'play' ? 'starting' : 'stopping'} schedule`,
      'error'
    );
  }
};

  const handleTrackAction = async (action, assetId) => {
    try {
      const formData = new FormData();
      formData.append('assetId', assetId);
      formData.append('playType', action);

      const response = await fetch(`${API_BASE_URL}/previewAsset`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Send cookies
      });

      if (!response.ok) {
        if (response.status === 401) {
          setSchedulerStatus('not-authenticated');
          throw new Error('Not authenticated');
        }
        throw new Error(`Failed to ${action} track`);
      }

      // Update playing items state
      setPlayingItems(prev => {
        const newSet = new Set(prev);
        if (action === 'play') {
          newSet.add(assetId);
        } else {
          newSet.delete(assetId);
        }
        return newSet;
      });

      showNotification(
        `${action === 'play' ? 'Started playing' : 'Stopped'} track successfully`, 
        'success'
      );
    } catch (error) {
      console.error('Error in track action:', error);
      showNotification(
        `Error ${action === 'play' ? 'playing' : 'stopping'} track`, 
        'error'
      );
    }
  };

  const getItemId = (item) => {
    return isTrack(item) ? item.Id : item.ScheduleId;
  };

  const getAssetName = (assetId) => {
    const asset = statusData.assets.find(a => a.Id === assetId);
    return asset?.Name || 'Unknown';
  };

  const getActionDisplayText = (action) => {
    const actionMap = {
      'PlayAudioZone1': 'Play Audio Zone1',
      'PlayAudioZone2': 'Play Audio Zone2',
      'PlayAudioZone3': 'Play Audio Zone3',
      'PlayAudioZone4': 'Play Audio Zone4',
      'PlayVideo': 'Play Video',
      'AudioPlayListZone1': 'Audio Playlist Zone1',
      'AudioPlayListZone2': 'Audio Playlist Zone2',
      'AudioPlayListZone3': 'Audio Playlist Zone3',
      'AudioPlayListZone4': 'Audio Playlist Zone4'
    };
    
    return actionMap[action] || action;
  };

  const getActionIcon = (action) => {
    if (action.includes('Video')) {
      return 'fas fa-video';
    } else if (action.includes('PlayList')) {
      return 'fas fa-list-music';
    } else {
      return 'fas fa-volume-up';
    }
  };

  const getFileIcon = (assetId) => {
    const asset = statusData.assets.find(a => a.Id === assetId);
    if (!asset || !asset.Name) return 'fas fa-file';
    
    const fileName = asset.Name.toLowerCase();
    const assetType = asset.AssetAction ? asset.AssetAction.toLowerCase() : '';
    
    if (fileName.includes('.mp4') || fileName.includes('.avi') || fileName.includes('.mov') || 
        fileName.includes('.wmv') || fileName.includes('.flv') || fileName.includes('.webm') ||
        fileName.includes('.mkv') || assetType.includes('video')) {
      return 'fas fa-video';
    }
    
    if (fileName.includes('.mp3') || fileName.includes('.wav') || fileName.includes('.flac') || 
        fileName.includes('.aac') || fileName.includes('.ogg') || fileName.includes('.wma') ||
        fileName.includes('.m4a') || assetType.includes('audio') || assetType.includes('music')) {
      return 'fas fa-music';
    }
    
    if (fileName.includes('.jpg') || fileName.includes('.jpeg') || fileName.includes('.png') || 
        fileName.includes('.gif') || fileName.includes('.bmp') || fileName.includes('.svg') ||
        fileName.includes('.webp') || assetType.includes('image')) {
      return 'fas fa-image';
    }
    
    if (fileName.includes('.pdf') || fileName.includes('.doc') || fileName.includes('.docx') || 
        fileName.includes('.txt') || fileName.includes('.rtf') || assetType.includes('document')) {
      return 'fas fa-file-alt';
    }
    
    return 'fas fa-file';
  };

  const formatDuration = (durationInSec) => {
    if (!durationInSec || durationInSec === 0) return '-';
    
    const minutes = Math.floor(durationInSec / 60);
    const seconds = durationInSec % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getScheduleCount = (type) => {
    switch (type) {
      case 'executing':
        return Object.values(statusData.runningActionSchedules).length;
      case 'last':
        return Object.values(statusData.lastExecutedActionSchedules).length;
      case 'upcoming':
        return Object.values(statusData.upcomingActionSchedules).length;
      default:
        return 0;
    }
  };

  // Helper function to generate unique keys
  const generateUniqueKey = (item, index, type) => {
    const itemIsTrack = isTrack(item);
    const baseId = itemIsTrack ? item.AssetId : item.ScheduleId;
    // Include type and index to ensure uniqueness across different sections and duplicate IDs
    return `${type}-${baseId}-${index}`;
  };

  const renderScheduleSection = (items, type, title, icon, colorClass) => {
    return (
      <div className="col-12 mb-4">
        <div className={styles.card}>
          <div className={styles['card-header']}>
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <div className={`${styles['schedule-icon']} ${styles[colorClass]}`}>
                  <i className={icon}></i>
                </div>
                <div>
                  <h5 className={styles['card-title']}>{title}</h5>
                  <small className={styles['text-muted']}>{items.length} items</small>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles['card-body']}>
            {items.length === 0 ? (
              <div className={styles['empty-state']}>
                <div className={styles['empty-icon']}>
                  <i className={`${icon} fa-3x`}></i>
                </div>
                <h5 className={styles['empty-title']}>No Schedules</h5>
                <p className={styles['empty-text']}>No schedules are currently {type}.</p>
              </div>
            ) : (
              <div className={styles['table-responsive']}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Name</th>
                      <th>Action</th>
                      <th>Schedule</th>
                      <th>Next Run</th>
                      <th>Duration</th>
                      <th>Asset</th>
                      <th className="text-end">Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const itemIsTrack = isTrack(item);
                      const itemId = itemIsTrack ? item.AssetId : item.ScheduleId;
                      const isPlaying = playingItems.has(itemId);

                      return (
                        <tr key={generateUniqueKey(item, index, type)}>
                          <td>
                            <div className={`${styles['schedule-number']} ${styles[type]}`}>
                              {index + 1}
                            </div>
                          </td>
                          <td>{item.Name}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className={`${getActionIcon(item.Action)} me-2`}></i>
                              {getActionDisplayText(item.Action)}
                            </div>
                          </td>
                          <td>{item.CronSpecDescr}</td>
                          <td>
                            <span className={`${styles.badge} ${styles[`bg-${colorClass.replace('text-', '')}`]}`}>
                              {item.NextInstance || (type === 'last' ? 'Completed' : 'Running')}
                            </span>
                          </td>
                          <td>{formatDuration(item.DurationInSec)}</td>
                          <td>{getAssetName(item.AssetId)}</td>
                          <td className="text-end">
                            <button 
                              type="button"
                              className={`${styles.btn} ${isPlaying ? styles['btn-outline-danger'] : styles['btn-outline-success']}`}
                              onClick={() => {
                                if (itemIsTrack) {
                                  handleTrackAction(isPlaying ? 'stop' : 'play', item.AssetId);
                                } else {
                                  handleScheduleAction(isPlaying ? 'stop' : 'play', item.ScheduleId);
                                }
                              }}
                            >
                              <i className={`fas fa-${isPlaying ? 'stop' : 'play'} me-1`}></i>
                              {isPlaying ? 'Stop' : 'Play'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="d-flex flex-column" style={{ minHeight: 'calc(100vh - 60px)', margin: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
        <div className="text-center py-5 flex-grow-1 d-flex flex-column align-items-center justify-content-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted">Loading system status...</h5>
          <p className="text-muted small">Please wait while we fetch the latest data</p>
        </div>
      </div>
    );
  }

  const getSchedulerStatusBadge = () => {
    switch (schedulerStatus) {
      case 'online':
        return (
          <span className="badge bg-success">
            <i className="fas fa-circle me-1" style={{ fontSize: '0.5rem' }}></i>
            Scheduler Online
          </span>
        );
      case 'offline':
        return (
          <span className="badge bg-danger">
            <i className="fas fa-circle me-1" style={{ fontSize: '0.5rem' }}></i>
            Scheduler Offline
          </span>
        );
      case 'not-authenticated':
        return (
          <span className="badge bg-warning">
            <i className="fas fa-circle me-1" style={{ fontSize: '0.5rem' }}></i>
            Not Authenticated
          </span>
        );
      default:
        return (
          <span className="badge bg-secondary">
            <i className="fas fa-circle me-1" style={{ fontSize: '0.5rem' }}></i>
            Unknown Status
          </span>
        );
    }
  };

  return (
    <div className={`${styles.statusContainer} py-4 d-flex flex-column`} style={{ minHeight: 'calc(100vh - 60px)', margin: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
      <FloatingNotification 
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h2 className="h4 mb-0 fw-bold text-dark">Status Dashboard</h2>
                </div>
                <div className="d-flex flex-column align-items-center" style={{ flex: '1' }}>
                  <h6 className="text-muted mb-2 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                    Time on Scheduler
                  </h6>
                  <div className="scheduler-time d-flex flex-column align-items-center">
                    <div className="badge bg-primary bg-gradient px-3 py-2 mb-1" style={{ fontSize: '1.1rem', fontWeight: '400' }}>
                      <i className="fas fa-clock me-2"></i>
                      {displayTime ? (
                        <>
                          <span style={{ fontFamily: 'monospace' }}>
                            {new Date(displayTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </>
                      ) : 'Loading...'}
                    </div>
                    <div className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.8rem' }}>
                      <i className="fas fa-calendar-alt me-2"></i>
                      {displayTime ? (
                        new Date(displayTime).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      ) : ''}
                    </div>
                  </div>
                </div>
                <div className="d-flex align-items-center">
                  <div className="status-indicator me-3">
                    {getSchedulerStatusBadge()}
                  </div>
                  <div className="system-version">
                    <span className="badge bg-light text-dark border">
                      <i className="fas fa-info-circle me-1"></i>
                      v{statusData.systemVersion || 'Loading...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row flex-grow-1 mb-4">
        {renderScheduleSection(
          Object.values(statusData.runningActionSchedules), 
          'executing', 
          'Currently Executing', 
          'fas fa-play-circle', 
          'text-warning'
        )}
        
        {renderScheduleSection(
          Object.values(statusData.upcomingActionSchedules), 
          'upcoming', 
          'Upcoming ', 
          'fas fa-calendar-alt', 
          'text-primary'
        )}
        
        {renderScheduleSection(
          Object.values(statusData.lastExecutedActionSchedules), 
          'last', 
          'Recently Executed', 
          'fas fa-history', 
          'text-success'
        )}
      </div>

      <style jsx>{`
        .schedule-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .schedule-number.executing {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        .schedule-number.last {
          background: #d1e7dd;
          color: #0a3622;
          border: 1px solid #a3cfbb;
        }

        .schedule-number.upcoming {
          background: #cff4fc;
          color: #055160;
          border: 1px solid #9eeaf9;
        }

        .schedule-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 1.2rem;
        }

        .section-icon.text-warning {
          background: #fff3cd;
        }

        .section-icon.text-success {
          background: #d1e7dd;
        }

        .section-icon.text-primary {
          background: #cff4fc;
        }

        .stat-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          font-size: 1.5rem;
        }

        .table th {
          font-size: 0.75rem;
          padding: 0.75rem;
          letter-spacing: 0.025em;
        }

        .table td {
          padding: 0.875rem 0.75rem;
          font-size: 0.875rem;
        }

        .card {
          transition: all 0.15s ease-in-out;
        }

        .btn-sm {
          font-size: 0.75rem;
          padding: 0.375rem 0.75rem;
          font-weight: 500;
        }

        .status-indicator .badge {
          font-size: 0.75rem;
          padding: 0.375rem 0.75rem;
        }

        .system-version .badge {
          font-size: 0.75rem;
          padding: 0.375rem 0.75rem;
        }

        @media (max-width: 768px) {
          .table-responsive {
            font-size: 0.8rem;
          }
          
          .d-flex.justify-content-between {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}