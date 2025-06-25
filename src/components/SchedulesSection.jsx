"use client";

import { useState, useEffect } from 'react';
import NewScheduleModal from './Modals/NewScheduleModal';
import EditScheduleModal from './Modals/EditScheduleModal';
import { Modal, Button } from 'react-bootstrap';
import FloatingNotification from './FloatingNotification';
import styles from '../styles/SchedulesSection.module.css';
import BackupSchedulesModal from './Modals/BackupSchedulesModal';
import RestoreSchedulesModal from './Modals/RestoreSchedulesModal';
import ConfirmationModal from './Modals/ConfirmationModal';

    // Base URL for API
const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? '/api/proxy' // Use proxy in development
  : ''; 

const SchedulesSection = () => {
  const [schedules, setSchedules] = useState([]);
  const [assets, setAssets] = useState([]);
  const [scheduleActions, setScheduleActions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [notification, setNotification] = useState(null);
  const [schedulerCookie, setSchedulerCookie] = useState(null);
  const [playingSchedules, setPlayingSchedules] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showClearInactiveConfirm, setShowClearInactiveConfirm] = useState(false);

  useEffect(() => {
    // Set the cookie from localStorage after component mounts
    const cookie = typeof window !== 'undefined' ? localStorage.getItem('mySchedulerCookie') : null;
    setSchedulerCookie(cookie);
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/initWithTime`, {
        method: 'GET',
        credentials: 'include', // Send cookies
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter out emergency assets
      const filteredAssets = (data.assets || []).filter(asset => asset.Role !== 'Emergency');
      setAssets(filteredAssets);
      setSchedules(data.schedules || []);
      setScheduleActions(data.scheduleActions || {});
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScheduleZone = (action) => {
    if (!action) return 'other';
    const lowerAction = action.toLowerCase();
    
    // Extract unique zones from scheduleActions
    const zones = Object.keys(scheduleActions).reduce((acc, key) => {
      const match = key.match(/Zone(\d+)/i);
      if (match) {
        acc.add(`zone${match[1]}`);
      }
      return acc;
    }, new Set());

    // Check the action against each zone
    for (const zone of zones) {
      const zoneNumber = zone.replace('zone', '');
      if (lowerAction.includes(`zone${zoneNumber}`)) return zone;
    }

    if (lowerAction.includes('video')) return 'video';
    return 'other';
  };

  const getFilteredSchedules = () => {
    if (activeTab === 'all') return schedules;
    return schedules.filter(schedule => getScheduleZone(schedule.Action) === activeTab);
  };

  const getZoneScheduleCount = (zone) => {
    if (zone === 'all') return schedules.length;
    return schedules.filter(schedule => getScheduleZone(schedule.Action) === zone).length;
  };

  const getTrackName = (assetId) => {
    const asset = assets.find(a => a.Id === assetId);
    return asset ? asset.Name : 'Unknown Track';
  };

  // Helper function to get appropriate icon based on file type
  const getFileIcon = (assetId) => {
    const asset = assets.find(a => a.Id === assetId);
    if (!asset || !asset.Name) return 'fas fa-file';
    
    const fileName = asset.Name.toLowerCase();
    const assetType = asset.AssetAction ? asset.AssetAction.toLowerCase() : '';
    
    // Video files
    if (fileName.includes('.mp4') || fileName.includes('.avi') || fileName.includes('.mov') || 
        fileName.includes('.wmv') || fileName.includes('.flv') || fileName.includes('.webm') ||
        fileName.includes('.mkv') || assetType.includes('video')) {
      return 'fas fa-video';
    }
    
    // Audio files
    if (fileName.includes('.mp3') || fileName.includes('.wav') || fileName.includes('.flac') || 
        fileName.includes('.aac') || fileName.includes('.ogg') || fileName.includes('.wma') ||
        fileName.includes('.m4a') || assetType.includes('audio') || assetType.includes('music')) {
      return 'fas fa-music';
    }
    
    // Image files
    if (fileName.includes('.jpg') || fileName.includes('.jpeg') || fileName.includes('.png') || 
        fileName.includes('.gif') || fileName.includes('.bmp') || fileName.includes('.svg') ||
        fileName.includes('.webp') || assetType.includes('image')) {
      return 'fas fa-image';
    }
    
    // Document files
    if (fileName.includes('.pdf') || fileName.includes('.doc') || fileName.includes('.docx') || 
        fileName.includes('.txt') || fileName.includes('.rtf') || assetType.includes('document')) {
      return 'fas fa-file-alt';
    }
    
    // Default file icon
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

  const handleToggleStatus = async (scheduleId, currentStatus) => {
    // Extra safety: check if scheduleId is valid
    if (!scheduleId || typeof scheduleId !== 'string' || scheduleId.trim() === '') {
      showNotification('Invalid schedule ID for toggling status.', 'error');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('Id', scheduleId);
      formData.append('NewState', (!currentStatus).toString());

      const response = await fetch(`${API_BASE_URL}/toggleSchedule`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Send cookies
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update the local state optimistically
      setSchedules(prevSchedules => 
        prevSchedules.map(schedule => 
          schedule.Id === scheduleId 
            ? { ...schedule, Active: !currentStatus }
            : schedule
        )
      );

      showNotification(
        `Schedule ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 
        'success'
      );
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Error updating schedule status', 'error');
      // Revert the optimistic update on error
      await fetchSchedules();
    }
  };

  const handleClearAllInactive = async () => {
    setShowClearInactiveConfirm(true);
  };

  const confirmClearAllInactive = async () => {
    try {
      const inactiveSchedules = schedules.filter(schedule => !schedule.Active);
      for (const schedule of inactiveSchedules) {
        // Extra safety: check if schedule and Id are valid
        if (!schedule || !schedule.Id || typeof schedule.Id !== 'string' || schedule.Id.trim() === '') {
          showNotification('Invalid schedule found while clearing inactive schedules. Skipping.', 'warning');
          continue;
        }
        const formData = new FormData();
        formData.append('Id', schedule.Id);
        await fetch(`${API_BASE_URL}/deleteSchedule`, {
          method: 'POST',
          body: formData,
          credentials: 'include', // Send cookies
        });
      }
      await fetchSchedules();
      showNotification('Inactive schedules cleared successfully', 'success');
    } catch (error) {
      console.error('Error clearing inactive schedules:', error);
      showNotification('Error clearing inactive schedules', 'danger');
    } finally {
      setShowClearInactiveConfirm(false);
    }
  };

  const handleScheduleCreated = async (result) => {
    await fetchSchedules(); // Refresh the schedules list
  };

  const handleScheduleUpdated = async (result) => {
    await fetchSchedules(); // Refresh the schedules list
    setSelectedSchedule(null);
    setShowEditScheduleModal(false);
  };

  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const handleEditClick = async (schedule) => {
    try {
      // Set the selected schedule directly without making an extra API call
      setSelectedSchedule(schedule);
      setShowEditScheduleModal(true);
    } catch (error) {
      console.error('Error setting up edit form:', error);
      showNotification('Error setting up edit form', 'error');
    }
  };

  const handleDeleteClick = (schedule) => {
    setScheduleToDelete(schedule);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    // Extra safety: check if scheduleToDelete and its Id are valid
    if (!scheduleToDelete || !scheduleToDelete.Id || typeof scheduleToDelete.Id !== 'string' || scheduleToDelete.Id.trim() === '') {
      showNotification('Invalid schedule selected for deletion.', 'error');
      setShowDeleteConfirm(false);
      setScheduleToDelete(null);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('Id', scheduleToDelete.Id);

      const response =await fetch(`${API_BASE_URL}/deleteSchedule`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Send cookies
      }); 

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      showNotification(`Schedule "${scheduleToDelete.Name}" deleted successfully`, 'success');
      setShowDeleteConfirm(false);
      setScheduleToDelete(null);
      await fetchSchedules(); // Refresh the list
    } catch (error) {
      console.error('Error deleting schedule:', error);
      showNotification('Error deleting schedule', 'error');
    }
  };

  const handlePlayClick = async (schedule) => {
    try {
      const formData = new FormData();
      formData.append('scheduleId', schedule.Id);

      // Optimistically update UI
      setPlayingSchedules(prev => new Set([...prev, schedule.Id]));

      const  response = await fetch(`${API_BASE_URL}/start_sch_now`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Send cookies
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setPlayingSchedules(prev => {
          const newSet = new Set(prev);
          newSet.delete(schedule.Id);
          return newSet;
        });
        throw new Error('Failed to start schedule');
      }

      showNotification(`Started schedule: ${schedule.Name}`, 'success');
    } catch (error) {
      console.error('Error starting schedule:', error);
      showNotification('Error starting schedule', 'error');
    }
  };

  const handleStopClick = async (schedule) => {
    try {
      const formData = new FormData();
      formData.append('scheduleId', schedule.Id);

      // Optimistically update UI
      setPlayingSchedules(prev => {
        const newSet = new Set(prev);
        newSet.delete(schedule.Id);
        return newSet;
      });

       const  response = await fetch(`${API_BASE_URL}/stop_sch_now`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Send cookies
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setPlayingSchedules(prev => new Set([...prev, schedule.Id]));
        throw new Error('Failed to stop schedule');
      }

      showNotification(`Stopped schedule: ${schedule.Name}`, 'success');
    } catch (error) {
      console.error('Error stopping schedule:', error);
      showNotification('Error stopping schedule', 'error');
    }
  };

  const handleBackupClick = () => {
    setShowBackupModal(true);
  };

  const handleRestoreClick = () => {
    setShowRestoreModal(true);
  };

  const handleRestoreSuccess = (message) => {
    showNotification(message, 'success');
    fetchSchedules(); // Refresh the schedules list after restore
  };

  const getAvailableZones = () => {
    // Extract unique zones from scheduleActions
    const zones = Object.keys(scheduleActions).reduce((acc, key) => {
      const match = key.match(/Zone(\d+)/i);
      if (match) {
        acc.add(`zone${match[1]}`);
      }
      return acc;
    }, new Set());

    // Convert to array and sort
    return Array.from(zones).sort((a, b) => {
      const numA = parseInt(a.replace('zone', ''));
      const numB = parseInt(b.replace('zone', ''));
      return numA - numB;
    });
  };

  const filteredSchedules = getFilteredSchedules();

  return (
    <div className={styles['schedules-container']} style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
      {/* Floating Notifications */}
      <FloatingNotification
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      
      <div className={styles.header}>
        <div className={styles['header-content']}>
          <h1>
            <i className="fas fa-calendar-alt me-2 text-primary"></i>
            Schedules
          </h1>
          <div className={styles['header-actions']}>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNewScheduleModal(true)}>
              <i className="fas fa-plus me-1"></i>New Schedule
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowBackupModal(true)}>
              <i className="fas fa-download me-1"></i>Backup
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowRestoreModal(true)}>
              <i className="fas fa-upload me-1"></i>Restore
            </button>
            <button 
              className="btn btn-outline-danger btn-sm" 
              onClick={handleClearAllInactive}
              disabled={!schedules.some(schedule => !schedule.Active)}
            >
              <i className="fas fa-trash me-1"></i>Clear Inactive
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={fetchSchedules}>
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className={styles['filter-bar']}>
          <div className={styles['tab-buttons']}>
            <button
              className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('all')}
            >
              <i className="fas fa-list-ul me-1"></i>
              All Schedules ({schedules.length})
            </button>
            {getAvailableZones().map(zone => (
              <button
                key={zone}
                className={`btn btn-sm ${activeTab === zone ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab(zone)}
              >
                <i className="fas fa-volume-up me-1"></i>
                Zone {zone.replace('zone', '')} ({getZoneScheduleCount(zone)})
              </button>
            ))}
            {Object.keys(scheduleActions).some(action => action.toLowerCase().includes('video')) && (
              <button
                className={`btn btn-sm ${activeTab === 'video' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setActiveTab('video')}
              >
                <i className="fas fa-video me-1"></i>
                Video ({getZoneScheduleCount('video')})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="content flex-grow-1">
        {error ? (
          <div className="d-flex flex-column align-items-center justify-content-center p-4 my-5" style={{ background: '#fff0f0', border: '1px solid #f8d7da', borderRadius: 12, boxShadow: '0 2px 8px rgba(220,53,69,0.08)' }}>
            <i className="fas fa-exclamation-triangle text-danger mb-3" style={{ fontSize: 48 }}></i>
            <h3 className="fw-bold text-danger mb-2">Failed to Load Schedules</h3>
            <p className="text-muted mb-3" style={{ maxWidth: 400, textAlign: 'center' }}>
              {error}
            </p>
            <button className="btn btn-danger px-4 py-2" onClick={fetchSchedules}>
              <i className="fas fa-redo-alt me-2"></i>
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="text-center p-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center p-4">
            <p className="text-muted">No schedules found</p>
            <button className="btn btn-primary" onClick={() => {
              setSelectedSchedule(null);
              setShowNewScheduleModal(true);
            }}>
              Create your first schedule
            </button>
          </div>
        ) : (
          <>
           

            {/* Schedules Table */}
            <div className={styles['table-container']}>
              <table className={`table table-hover ${styles['schedules-table']}`}>
                <thead>
                    <tr>
                      <th>Status</th>
                      <th>Task Name</th>
                      <th>Action Type</th>
                      <th>Schedule</th>
                      <th>Duration</th>
                      <th>Next Run</th>
                      <th>Media File</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSchedules.map((schedule, index) => (
                    <tr key={schedule.Id} className={styles['schedule-row']}>
                      <td>
                        <div className={styles['status-checkbox']}>
                            <input 
                              type="checkbox" 
                              id={`statusCheckbox${schedule.Id}`}
                              checked={schedule.Active}
                              onChange={() => handleToggleStatus(schedule.Id, schedule.Active)}
                            className={styles['status-checkbox-input']}
                            />
                          <label htmlFor={`statusCheckbox${schedule.Id}`} className={styles['status-checkbox-label']}>
                            <span className={styles['checkbox-custom']}></span>
                            <span className={`${styles['status-text']} ${schedule.Active ? styles.active : styles.inactive}`}>
                                {schedule.Active ? 'Active' : 'Inactive'}
                              </span>
                            </label>
                          </div>
                        </td>
                        
                      <td>
                        <div className={styles['name-cell']}>
                          <div className={styles['schedule-number']}>
                              {index + 1}
                            </div>
                            <span>{schedule.Name}</span>
                          </div>
                        </td>
                        
                      <td>
                        <span className={`${styles['action-badge']} ${schedule.Action.includes('Video') ? styles.video : schedule.Action.includes('PlayList') ? styles.playlist : styles.audio}`}>
                            <i className={`${getActionIcon(schedule.Action)} me-1`}></i>
                            {getActionDisplayText(schedule.Action)}
                          </span>
                        </td>
                        
                      <td>
                        <div className={styles['cron-cell']}>
                            <i className="fas fa-clock me-1"></i>
                            {schedule.CronSpecDescr}
                          </div>
                        </td>
                        
                      <td>
                        <div className={styles['duration-cell']}>
                            <i className="fas fa-stopwatch me-1"></i>
                            {formatDuration(schedule.DurationInSec)}
                          </div>
                        </td>
                        
                      <td>
                        <span className={styles['next-run-badge']}>
                            {schedule.NextInstance}
                          </span>
                        </td>
                        
                      <td>
                        <div className={styles['track-cell']}>
                            <i className={`${getFileIcon(schedule.AssetId)} me-1`}></i>
                            {getTrackName(schedule.AssetId)}
                          </div>
                        </td>
                        
                      <td>
                          <div className="btn-group btn-group-sm" role="group">
                          {playingSchedules.has(schedule.Id) ? (
                            <button 
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleStopClick(schedule)}
                              title="Stop Schedule"
                            >
                              <i className="fas fa-stop"></i>
                            </button>
                          ) : (
                            <button 
                              type="button"
                              className="btn btn-outline-success btn-sm"
                              onClick={() => handlePlayClick(schedule)}
                              title="Play Schedule"
                            >
                              <i className="fas fa-play"></i>
                            </button>
                          )}
                            <button 
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                            onClick={() => handleEditClick(schedule)}
                              title="Edit Schedule"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDeleteClick(schedule)}
                              title="Delete Schedule"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </>
        )}
      </div>

      <NewScheduleModal
        show={showNewScheduleModal}
        onHide={() => {
          setShowNewScheduleModal(false);
          setSelectedSchedule(null);
        }}
        onCreate={handleScheduleCreated}
        onNotification={showNotification}
        baseURL={process.env.NEXT_PUBLIC_API_BASE_URL}
        mySchedulerCookie={schedulerCookie}
        assets={assets}
        scheduleActions={scheduleActions}
      />

      <EditScheduleModal
        show={showEditScheduleModal}
        onHide={() => {
          setShowEditScheduleModal(false);
          setSelectedSchedule(null);
        }}
        onUpdate={handleScheduleUpdated}
        onNotification={showNotification}
        assets={assets}
        scheduleActions={scheduleActions}
        schedule={selectedSchedule}
      />

      <BackupSchedulesModal
        show={showBackupModal}
        onHide={() => setShowBackupModal(false)}
      />

      <RestoreSchedulesModal
        show={showRestoreModal}
        onHide={() => setShowRestoreModal(false)}
        onSuccess={handleRestoreSuccess}
      />

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete Schedule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <div className="mb-3">
              <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '3rem' }}></i>
            </div>
            <h5>Are you sure you want to delete this schedule?</h5>
            {scheduleToDelete && (
              <p className="text-muted">
                Schedule: <strong>{scheduleToDelete.Name}</strong>
              </p>
            )}
            <p className="text-danger mb-0">This action cannot be undone.</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal for Clear Inactive */}
      <ConfirmationModal
        show={showClearInactiveConfirm}
        onHide={() => setShowClearInactiveConfirm(false)}
        title="Clear Inactive Schedules"
        message="Are you sure you want to clear all inactive schedules? This action cannot be undone."
        onConfirm={confirmClearAllInactive}
        confirmLabel="Yes, Clear Inactive"
        confirmVariant="danger"
      />
    </div>
  );
};

export default SchedulesSection;