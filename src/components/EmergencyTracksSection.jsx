"use client";

import { useState, useEffect } from 'react';
import styles from '../styles/EmergencyTracksSection.module.css';
import Notification from './Notification';
import NewEmergencyTrackModal from './Modals/NewEmergencyTrackModal';
import DeleteConfirmationModal from './Modals/DeleteConfirmationModal';


const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? '/api/proxy' // Use proxy in development
  : '';

export default function EmergencyTracksSection() {
  const [emergencyAssets, setEmergencyAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [playingAssets, setPlayingAssets] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedAssetName, setSelectedAssetName] = useState('');

  // Track if this is the initial load
  const [initialLoad, setInitialLoad] = useState(true);

const fetchData = async (isSilent = false) => {
  try {
    setError(null);
    if (!isSilent) setLoading(true);

    const response = await fetch(`${API_BASE_URL}/initWithTime`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      throw new Error(errorData.error || 'Failed to fetch data');
    }

    const data = await response.json();

    if (!data.assets || !Array.isArray(data.assets)) {
      setEmergencyAssets([]);
      return;
    }

    const emergencyTracks = data.assets.filter(asset => asset.Role === 'Emergency');
    setEmergencyAssets(emergencyTracks || []);

    const runningActions = data.runningActionSchedules || {};
    const newPlayingState = {};
    Object.entries(runningActions).forEach(([id, action]) => {
      if (action.Name === '[[ManualPlay]]') {
        newPlayingState[id] = true;
      }
    });
    setPlayingAssets(newPlayingState);

  } catch (error) {
    console.error('Error fetching data:', error);
    setError(error.message);
    Notification({
      message: 'Error loading emergency tracks',
      type: 'danger'
    });
  } finally {
    setLoading(false);
    setInitialLoad(false);
  }
};


  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePlayStop = async (action, id) => {
    try {
      const formData = new FormData();
      formData.append('assetId', id);
      formData.append('playType', action);

       const response = await fetch(`${API_BASE_URL}/previewAsset`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Send cookies
      });


      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error(errorData.error || `Failed to ${action} track`);
      }

      // Update local state optimistically
      setPlayingAssets(prev => ({
        ...prev,
        [id]: action === 'play'
      }));

      Notification({
        message: `${action === 'play' ? 'Started' : 'Stopped'} emergency track successfully`,
        type: 'success',
      });

      // Refresh data to ensure sync
      fetchData();

    } catch (error) {
      console.error('Error in action:', error);
      Notification({
        message: error.message || 'Error performing action',
        type: 'danger',
      });
    }
  };

  const handleDelete = async (id) => {
    const asset = emergencyAssets.find(a => a.Id === id);
    setSelectedAssetId(id);
    setSelectedAssetName(asset?.Name || 'Unnamed Emergency Track');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const formData = new FormData();
      formData.append('Id', selectedAssetId);

      const response = await fetch(`${API_BASE_URL}/deleteAsset`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete asset');
      }

      setPlayingAssets((prev) => {
        const newState = { ...prev };
        delete newState[selectedAssetId];
        return newState;
      });
      
      await fetchData();
      setShowDeleteModal(false);
      Notification({ message: 'Emergency track deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting track:', error);
      Notification({ message: error.message, type: 'danger' });
    }
  };

  return (
    <div className="emergency-container d-flex flex-column" style={{ minHeight: 'calc(100vh - 60px)' }}>
      <div className="row justify-content-center">
        <div className="col-12">
          <div style={{ padding: '24px', margin: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
            <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-3">
              <div className="d-flex align-items-center gap-2">
                <i className="fas fa-exclamation-triangle text-danger fs-3 me-2"></i>
                <h2 className="fw-bold mb-0 fs-4">Emergency Tracks</h2>
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <button
                  className="btn btn-danger btn-sm d-flex align-items-center"
                  onClick={() => setShowNewModal(true)}
                  disabled={loading}
                  title="Add Emergency Track"
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Emergency Track
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                  onClick={fetchData}
                  disabled={loading}
                  title="Refresh Tracks"
                >
                  <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
                </button>
              </div>
            </div>
            <hr className="my-3" />
            <div className="table-responsive">
              {initialLoad && loading ? (
                <div className="text-center p-4">
                  <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '220px' }}>
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
                    <h5 className="fw-bold mb-2">Failed to Load Emergency Tracks</h5>
                    <div className="text-muted mb-3" style={{ fontSize: '1rem' }}>{error}</div>
                    <button
                      className="btn btn-danger btn-sm d-flex align-items-center justify-content-center mx-auto"
                      style={{ minWidth: 110, fontWeight: 500 }}
                      onClick={fetchData}
                    >
                      <i className="fas fa-redo-alt me-2" style={{ fontSize: '1rem' }}></i>
                      Try Again
                    </button>
                  </div>
                </div>
              ) : emergencyAssets.length === 0 ? (
                <div className="text-center p-4">
                  <i className="fas fa-exclamation-circle fa-2x text-warning mb-2"></i>
                  <h5 className="fw-semibold mb-1">No Emergency Tracks</h5>
                  <p className="text-muted mb-2">No emergency tracks are currently available.</p>
                  <button className="btn btn-danger btn-sm" onClick={() => setShowNewModal(true)}>
                    <i className="fas fa-plus me-1"></i>Add Emergency Track
                  </button>
                </div>
              ) : (
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Duration</th>
                      <th>Created</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emergencyAssets.map((asset, idx) => (
                      <tr key={asset.Id}>
                        <td>{idx + 1}</td>
                        <td className="fw-semibold">
                          <i className={`fas ${asset.Type?.toLowerCase().includes('video') ? 'fa-video' : 'fa-volume-up'} me-2`}></i>
                          {asset.Name}
                        </td>
                        <td>{asset.Type}</td>
                        <td>{asset.Duration || 'N/A'}</td>
                        <td>{new Date(asset.CreatedAt).toLocaleDateString()}</td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm" role="group">
                            <button
                              className={`btn ${playingAssets[asset.Id] ? 'btn-danger' : 'btn-success'} btn-sm`}
                              onClick={() => handlePlayStop(playingAssets[asset.Id] ? 'stop' : 'play', asset.Id)}
                              title={playingAssets[asset.Id] ? 'Stop' : 'Play'}
                            >
                              <i className={`fas fa-${playingAssets[asset.Id] ? 'stop' : 'fa-play'}`}></i>
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDelete(asset.Id)}
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
      <NewEmergencyTrackModal
        show={showNewModal}
        onHide={() => setShowNewModal(false)}
        onSuccess={fetchData}
      />
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Emergency Track"
        message={`Are you sure you want to delete "${selectedAssetName}"? This action cannot be undone.`}
      />
    </div>
  );
}
