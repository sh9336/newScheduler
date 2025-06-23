"use client";
import { useState, useEffect } from 'react';
import EditTrackModal from './Modals/EditTrackModal';
import NewTrackModal from './Modals/NewTrackModal';
import UploadBigAssetModal from './Modals/UploadBigAssetModal';
import Notification from './Notification';
import DeleteConfirmationModal from './Modals/DeleteConfirmationModal';

const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? '/api/proxy' // Use proxy in development
  : ''; 

export default function TracksSection() {
const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showUploadBigModal, setShowUploadBigModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [selectedAssetName, setSelectedAssetName] = useState('');
  const [playingAssets, setPlayingAssets] = useState({});

  const fetchAssets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/initWithTime`, {
        method: 'GET',
        credentials: 'include', // Send cookies
      });

      if (!response.ok) {
        const { error, details } = await response.json();
        throw new Error(details || error || 'Failed to fetch assets');
      }
      const data = await response.json();
      setAssets(data.assets || []); // Access the assets array from the response
      setError(null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assets:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleDelete = async (id) => {
    const asset = assets.find(a => a.Id === id);
    setSelectedAssetId(id);
    setSelectedAssetName(asset?.Name || 'Unnamed Track');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const formData = new FormData();
      formData.append('Id', selectedAssetId);

      const response = await fetch(`${API_BASE_URL}/deleteAsset`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Send cookies
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
      
      await fetchAssets();
      setShowDeleteModal(false);
      Notification({ message: 'Track deleted successfully', type: 'success' });
    } catch (error) {
      console.error('Error deleting track:', error);
      Notification({ message: error.message, type: 'danger' });
    }
  };

  const handleEdit = (id) => {
    setSelectedAssetId(id);
    setShowEditModal(true);
  };

  const handlePreview = async (action, id) => {
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
        const { error, details } = await response.json();
        throw new Error(details || error || 'Failed to preview asset');
      }

      // Update playing state only on successful response
      setPlayingAssets((prev) => ({
        ...prev,
        [id]: action === 'play',
      }));
      
      // Add notification for successful action
      const asset = assets.find(a => a.Id === id);
      const assetName = asset?.Name || 'Track';
      Notification({ 
        message: `${action === 'play' ? 'Started playing' : 'Stopped'} ${assetName}`, 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error in preview:', error);
      setError(`Failed to ${action} asset: ${error.message}`);
      // Add notification for error
      Notification({ 
        message: `Failed to ${action} track: ${error.message}`, 
        type: 'danger' 
      });
    }
  };

  // Helper functions (unchanged)
  const getFileIcon = (assetName, assetType) => {
    if (!assetName) return 'fas fa-file';
    const fileName = assetName.toLowerCase();
    const type = assetType ? assetType.toLowerCase() : '';
    if (fileName.includes('.mp4') || fileName.includes('.avi') || fileName.includes('.mov') || 
        fileName.includes('.wmv') || fileName.includes('.flv') || fileName.includes('.webm') ||
        fileName.includes('.mkv') || type.includes('video')) {
      return 'fas fa-video';
    }
    if (fileName.includes('.mp3') || fileName.includes('.wav') || fileName.includes('.flac') || 
        fileName.includes('.aac') || fileName.includes('.ogg') || fileName.includes('.wma') ||
        fileName.includes('.m4a') || type.includes('audio') || type.includes('music')) {
      return 'fas fa-music';
    }
    if (fileName.includes('.jpg') || fileName.includes('.jpeg') || fileName.includes('.png') || 
        fileName.includes('.gif') || fileName.includes('.bmp') || fileName.includes('.svg') ||
        fileName.includes('.webp') || type.includes('image')) {
      return 'fas fa-image';
    }
    if (fileName.includes('.pdf') || fileName.includes('.doc') || fileName.includes('.docx') || 
        fileName.includes('.txt') || fileName.includes('.rtf') || type.includes('document')) {
      return 'fas fa-file-alt';
    }
    return 'fas fa-file';
  };

  const formatFileSize = (sizeInKB) => {
    if (!sizeInKB || sizeInKB === 'N/A') return 'N/A';
    const kb = parseFloat(sizeInKB);
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${(kb / (1024 * 1024)).toFixed(1)} GB`;
  };

  const formatDuration = (durationInSec) => {
    if (!durationInSec || durationInSec === 'N/A') return 'N/A';
    const seconds = parseInt(durationInSec);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNewModal = () => setShowNewModal(true);
  const handleUploadBigModal = () => setShowUploadBigModal(true);

  return (
    <div className="tracks-container d-flex flex-column" style={{ minHeight: 'calc(100vh - 60px)', padding: '24px', margin: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <h1>Media Assets Library</h1>
          <div className="header-actions">
            <button
              className="btn btn-success btn-sm"
              onClick={handleNewModal}
              disabled={loading}
              title="Upload Small Files"
            >
              <i className="fas fa-plus me-1"></i>
              Small Files
            </button>
            <button
              className="btn btn-info btn-sm"
              onClick={handleUploadBigModal}
              disabled={loading}
              title="Upload Large Files"
            >
              <i className="fas fa-upload me-1"></i>
              Large Files
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={fetchAssets}
              disabled={loading}
              title="Refresh Assets"
            >
              <i className={`fas fa-sync-alt ${loading ? 'spinning' : ''}`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="content flex-grow-1">
        {loading ? (
          <div className="loading-state">
            <i className="fas fa-folder-open spinning"></i>
            <p>Loading media assets...</p>
          </div>
        ) : error ? (
          <div className="d-flex flex-column align-items-center justify-content-center p-4 my-5" style={{ background: '#fff0f0', border: '1px solid #f8d7da', borderRadius: 12, boxShadow: '0 2px 8px rgba(220,53,69,0.08)' }}>
            <i className="fas fa-exclamation-triangle text-danger mb-3" style={{ fontSize: 48 }}></i>
            <h3 className="fw-bold text-danger mb-2">Failed to Load Media Assets</h3>
            <p className="text-muted mb-3" style={{ maxWidth: 400, textAlign: 'center' }}>
              {error}
            </p>
            <button className="btn btn-danger btn-sm d-flex align-items-center justify-content-center" style={{ borderRadius: 6, backgroundColor: '#dc3545', color: '#fff', borderColor: '#dc3545' }} onClick={fetchAssets}>
              <i className="fas fa-redo-alt me-1" style={{ fontSize: '0.95em', lineHeight: 1 }}></i>
              <span>Try Again</span>
            </button>
          </div>
        ) : assets.length === 0 ? (
          <div className="empty-state d-flex flex-column align-items-center justify-content-center p-4 my-5" style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 2px 8px rgba(59,130,246,0.05)' }}>
            <i className="fas fa-folder-open text-primary mb-3" style={{ fontSize: 48 }}></i>
            <h3 className="fw-bold text-primary mb-2">No Media Assets</h3>
            <p className="text-muted mb-3" style={{ maxWidth: 400, textAlign: 'center' }}>
              Upload your first media file to get started
            </p>
            <button className="btn btn-success btn-sm d-flex align-items-center justify-content-center" style={{ borderRadius: 6, minWidth: 0 }} onClick={handleNewModal}>
              <span className="w-100 d-flex align-items-center justify-content-center gap-1">
                <i className="fas fa-plus" style={{ fontSize: '0.85em', lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}></i>
                <span>Upload Your First File</span>
              </span>
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table table-hover table-sm assets-table">
              <thead className="table-light">
                <tr>
                  <th>Asset Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, index) => (
                  <tr key={asset.Id} className="asset-row">
                    <td className="asset-name">
                      <div className="name-cell">
                        <div className="asset-number">{index + 1}</div>
                        <div className="file-info">
                          <i className={`${getFileIcon(asset.Name, asset.AssetAction)} me-2`}></i>
                          <span title={asset.Name || 'Unnamed Asset'}>
                            {asset.Name || 'Unnamed Asset'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="asset-type">
                      <span className="type-badge">{asset.AssetAction || 'Unknown'}</span>
                    </td>
                    <td className="asset-size">
                      <div className="size-cell">
                        <i className="fas fa-hdd me-1"></i>
                        {formatFileSize(asset.FileSize)}
                      </div>
                    </td>
                    <td className="asset-duration">
                      <div className="duration-cell">
                        <i className="fas fa-clock me-1"></i>
                        {formatDuration(asset.DurationInSec)}
                      </div>
                    </td>
                    <td className="asset-actions">
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          type="button"
                          className={`btn ${playingAssets[asset.Id] ? 'btn-outline-danger' : 'btn-outline-success'} btn-sm`}
                          onClick={() => handlePreview(playingAssets[asset.Id] ? 'stop' : 'play', asset.Id)}
                          title={playingAssets[asset.Id] ? 'Stop' : 'Play'}
                          disabled={loading}
                        >
                          <i className={`fas ${playingAssets[asset.Id] ? 'fa-stop' : 'fa-play'}`}></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleEdit(asset.Id)}
                          title="Edit"
                          disabled={loading}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(asset.Id)}
                          title="Delete"
                          disabled={loading}
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
        )}
      </div>

      {/* Modals */}
      <EditTrackModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        assetId={selectedAssetId}
        onUpdate={fetchAssets}
      />
      <NewTrackModal
        show={showNewModal}
        onHide={() => setShowNewModal(false)}
        onCreate={fetchAssets}
      />
      <UploadBigAssetModal
        show={showUploadBigModal}
        onHide={() => setShowUploadBigModal(false)}
        onUpload={fetchAssets}
      />
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        trackName={selectedAssetName}
      />

      <style jsx>{`
        .tracks-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          margin-bottom: 24px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .header-actions .btn {
          white-space: nowrap;
        }

        .content {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .loading-state,
        .error-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .loading-state i,
        .error-state i,
        .empty-state i {
          font-size: 48px;
          margin-bottom: 16px;
          color: #9ca3af;
        }

        .loading-state h3,
        .error-state h3,
        .empty-state h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .loading-state p,
        .error-state p,
        .empty-state p {
          margin: 0 0 24px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .table-container {
          overflow-x: auto;
        }

        .assets-table {
          width: 100%;
        }

        .assets-table th {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 8px 12px !important;
        }

        .asset-row td {
          padding: 8px 12px !important;
          vertical-align: middle;
        }

        .asset-name {
          min-width: 300px;
        }

        .name-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .asset-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: #eff6ff;
          color: #3b82f6;
          border-radius: 50%;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .file-info {
          display: flex;
          align-items: center;
          min-width: 0;
        }

        .file-info span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 250px;
        }

        .type-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #e5e7eb;
        }

        .size-cell,
        .duration-cell {
          display: flex;
          align-items: center;
          font-size: 13px;
          color: #6b7280;
        }

        .asset-actions {
          text-align: right;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Bootstrap button styling */
        .btn {
          display: inline-block;
          font-weight: 400;
          line-height: 1.5;
          color: #212529;
          text-align: center;
          text-decoration: none;
          vertical-align: middle;
          cursor: pointer;
          user-select: none;
          background-color: transparent;
          border: 1px solid transparent;
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
          border-radius: 0.375rem;
          transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }

        .btn:hover {
          text-decoration: none;
        }

        .btn:focus {
          outline: 0;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }

        .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          border-radius: 0.25rem;
        }

        .btn-primary {
          color: #fff;
          background-color: #007bff;
          border-color: #007bff;
        }

        .btn-primary:hover {
          background-color: #0056b3;
          border-color: #004085;
        }

        .btn-success {
          color: #fff;
          background-color: #28a745;
          border-color: #28a745;
        }

        .btn-success:hover {
          background-color: #1e7e34;
          border-color: #1c7430;
        }

        .btn-info {
          color: #fff;
          background-color: #17a2b8;
          border-color: #17a2b8;
        }

        .btn-info:hover {
          background-color: #117a8b;
          border-color: #10707f;
        }

        .btn-outline-secondary {
          color: #6c757d;
          border-color: #6c757d;
        }

        .btn-outline-secondary:hover {
          color: #fff;
          background-color: #6c757d;
          border-color: #6c757d;
        }

        .btn-outline-success {
          color: #28a745;
          border-color: #28a745;
        }

        .btn-outline-success:hover {
          color: #fff;
          background-color: #28a745;
          border-color: #28a745;
        }

        .btn-outline-primary {
          color: #007bff;
          border-color: #007bff;
        }

        .btn-outline-primary:hover {
          color: #fff;
          background-color: #007bff;
          border-color: #007bff;
        }

        .btn-outline-danger {
          color: #dc3545;
          border-color: #dc3545;
        }

        .btn-outline-danger:hover {
          color: #fff;
          background-color: #dc3545;
          border-color: #dc3545;
        }

        .btn-group {
          position: relative;
          display: inline-flex;
          vertical-align: middle;
        }

        .btn-group > .btn {
          position: relative;
          flex: 1 1 auto;
        }

        .btn-group > .btn:not(:first-child) {
          margin-left: -1px;
        }

        .btn-group > .btn:not(:last-child) {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }

        .btn-group > .btn:not(:first-child) {
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }

        .table {
          width: 100%;
          margin-bottom: 1rem;
          color: #212529;
          border-collapse: collapse;
        }

        .table th,
        .table td {
          padding: 0.75rem;
          vertical-align: top;
          border-top: 1px solid #dee2e6;
        }

        .table thead th {
          vertical-align: bottom;
          border-bottom: 2px solid #dee2e6;
        }

        .table-light {
          background-color: #f8f9fa;
        }

        .table-hover tbody tr:hover {
          background-color: rgba(0, 0, 0, 0.075);
        }

        .me-1 { margin-right: 0.25rem !important; }
        .me-2 { margin-right: 0.5rem !important; }

        @media (max-width: 768px) {
          .tracks-container {
            padding: 16px;
          }

          .header-content {
            flex-direction: column;
            align-items: stretch;
          }

          .header-actions {
            justify-content: center;
          }

          .file-info span {
            max-width: 150px;
          }
        }
      `}</style>
    </div>
  );
}