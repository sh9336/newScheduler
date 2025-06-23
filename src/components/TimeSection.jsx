"use client";

import { useState, useEffect } from 'react';
import styles from '../styles/TimeSection.module.css';
import TimeSettingsModal from './Modals/TimeSettingsModal';
import ClockSkewModal from './Modals/ClockSkewModal';
import Notification from './Notification';

  // Base URL for API
  const API_BASE_URL = process.env.NODE_ENV === 'development'
    ? '/api/proxy' // Use proxy in development
    : '';

export default function TimeSection() {
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showClockSkewModal, setShowClockSkewModal] = useState(false);
  const [timeData, setTimeData] = useState({
    systemTime: '',
    rtcTime: '-',
    browserTime: '',
    timeWhenFetchedFromSource: 0,
    currentTimeUnix: 0,
    lastRtcUnix: 0,
    lastBrowserUnix: 0,
    clockSkewOffset: 0,
  });

 // Direct backend in production

  // Format Unix timestamp to 12-hour time in IST
  const formatUnixTime = (unixTime) => {
    if (!unixTime || unixTime === '-') return '-';
    const date = new Date(parseInt(unixTime));
    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  };

  // Fetch time data
  const loadTimeData = async () => {
    try {
      const formData = new FormData();
      formData.append('milliSecSince1970', Date.now().toString());

      const response = await fetch(`${API_BASE_URL}/getRTCAndSystemTime`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Send cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Time API Fetch Error:', errorData);
        Notification({ message: 'Failed to fetch time data. Displaying last known time.', type: 'warning' });
        return;
      }

      const data = await response.json();
      if (data.status === 1) {
        const roundTrip = Date.now() - data.lastBrowserTime;
        const delayStr = roundTrip > 1000 ? ` (Network Delay: ${roundTrip}ms)` : '';

        setTimeData((prev) => ({
          ...prev,
          systemTime: formatUnixTime(data.systemTime),
          rtcTime: data.rtcTime === '-' ? '-' : formatUnixTime(data.rtcTime),
          browserTime: formatUnixTime(data.lastBrowserTime) + delayStr,
          timeWhenFetchedFromSource: Date.now(),
          currentTimeUnix: parseInt(data.systemTime, 10),
          lastRtcUnix: data.rtcTime === '-' ? prev.lastRtcUnix : parseInt(data.rtcTime, 10),
          lastBrowserUnix: parseInt(data.lastBrowserTime, 10),
          clockSkewOffset: data.clockSkewOffset || 0,
        }));
      } else if (data.message) {
        Notification({ message: data.message, type: 'warning' });
      }
    } catch (error) {
      console.error('Error fetching time data:', error);
      Notification({ message: 'Error fetching time data. Displaying last known time.', type: 'danger' });
    }
  };

  // Handle clock skew update
  const handleClockSkewUpdate = async (millisecondsPerDay) => {
    try {
      const formData = new FormData();
      formData.append('millisecondsPerDay', millisecondsPerDay);

      const response = await fetch(`${API_BASE_URL}/clockSkewOffset`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });


      if (!response.ok) {
        throw new Error('Failed to update clock skew');
      }


      const data = await response.json();
      if (data.success) {
        setTimeData((prev) => ({
          ...prev,
          clockSkewOffset: millisecondsPerDay,
        }));
        Notification({ message: 'Clock skew updated successfully', type: 'success' });
      } else {
        throw new Error(data.error || 'Failed to update clock skew.');
      }
    } catch (error) {
      console.error('Error updating clock skew:', error);
      Notification({ message: error.message, type: 'danger' });
      throw error;
    }
  };

  // Handle time update
  const handleTimeUpdate = async (newTime) => {
    try {
      const formData = new FormData();
      formData.append('milliSecSince1970', newTime);

      const response = await fetch(`${API_BASE_URL}/updateTime`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update time', {
          cause: errorData.details,
        });
      }

      const data = await response.json();
      if (data.success) {
        Notification({ message: 'Time updated successfully', type: 'success' });
        loadTimeData();
      } else {
        throw new Error(data.error || 'Failed to update time', {
          cause: data.details,
        });
      }
    } catch (error) {
      console.error('Error updating time:', error);
      const message =
        error.message === 'RTC hardware is not active.' || error.cause === 'RTC hardware is not active.'
          ? 'Cannot update time: RTC hardware is not active. Please check the device.'
          : error.message + (error.cause ? `: ${error.cause}` : '');
      Notification({ message, type: 'danger' });
    }
  };

  useEffect(() => {
    loadTimeData();
    const apiInterval = setInterval(loadTimeData, 10000);

    const timeUpdateInterval = setInterval(() => {
      setTimeData((prev) => {
        const newTimeUnix = prev.currentTimeUnix + 1000;
        const rtcUnix = prev.lastRtcUnix ? prev.lastRtcUnix + 1000 : prev.lastRtcUnix;
        const browserUnix = prev.lastBrowserUnix + 1000;
        return {
          ...prev,
          systemTime: formatUnixTime(newTimeUnix),
          rtcTime: prev.rtcTime === '-' ? '-' : formatUnixTime(rtcUnix),
          browserTime: formatUnixTime(browserUnix),
          currentTimeUnix: newTimeUnix,
          lastRtcUnix: rtcUnix,
          lastBrowserUnix: browserUnix,
        };
      });
    }, 1000);

    return () => {
      clearInterval(apiInterval);
      clearInterval(timeUpdateInterval);
    };
  }, []);

  return (
    <div className={styles.timeSection} style={{ minHeight: 'calc(100vh - 60px)' }}>
      <div style={{ padding: '24px', margin: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-3">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-clock text-primary fs-3 me-2"></i>
            <h2 className="fw-bold mb-0 fs-4">Time Settings</h2>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              className="btn btn-primary btn-sm d-flex align-items-center"
              onClick={() => setShowTimeModal(true)}
              title="Sync Time"
            >
              <i className="fas fa-sync-alt me-2"></i>
              Sync Time
            </button>
            <button
              className="btn btn-outline-primary btn-sm d-flex align-items-center"
              onClick={() => setShowClockSkewModal(true)}
              title="Set Clock Skew"
            >
              <i className="fas fa-clock me-2"></i>
              Set Clock Skew
            </button>
            <button
              className="btn btn-outline-secondary btn-sm d-flex align-items-center"
              onClick={loadTimeData}
              title="Refresh Time Data"
            >
              <i className="fas fa-redo"></i>
            </button>
          </div>
        </div>
        <hr className="my-3" />
        <div className="row g-4">
          <div className="col-12 col-md-4">
            <div className="bg-light rounded-3 p-4 h-100 shadow-sm">
              <div className="d-flex align-items-center mb-2">
                <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                  <i className="fas fa-server text-primary"></i>
                </div>
                <h5 className="mb-0">System Time</h5>
              </div>
              <div className="fs-4 fw-semibold mb-1">
                {timeData.systemTime || 'Loading...'}
              </div>
              <div className="text-muted small">Scheduler System Time</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="bg-light rounded-3 p-4 h-100 shadow-sm">
              <div className="d-flex align-items-center mb-2">
                <div className="bg-danger bg-opacity-10 rounded-circle p-2 me-2">
                  <i className="fas fa-clock text-danger"></i>
                </div>
                <h5 className="mb-0">RTC Time</h5>
              </div>
              <div className="fs-4 fw-semibold mb-1">
                {timeData.rtcTime === '-' ? 'RTC Busy (Unavailable)' : timeData.rtcTime}
              </div>
              <div className="text-muted small">Real-Time Clock</div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="bg-light rounded-3 p-4 h-100 shadow-sm">
              <div className="d-flex align-items-center mb-2">
                <div className="bg-success bg-opacity-10 rounded-circle p-2 me-2">
                  <i className="fas fa-laptop text-success"></i>
                </div>
                <h5 className="mb-0">Browser Time</h5>
              </div>
              <div className="fs-4 fw-semibold mb-1">
                {timeData.browserTime.split(' (')[0] || 'Loading...'}
                {timeData.browserTime.includes('Network Delay') && (
                  <span className="badge bg-warning ms-2" title="Network Delay">
                    {timeData.browserTime.match(/Network Delay: \d+ms/)[0]}
                  </span>
                )}
              </div>
              <div className="text-muted small">Server-Received Browser Time</div>
            </div>
          </div>
        </div>
        {timeData.clockSkewOffset !== 0 && (
          <div className="alert alert-info mt-4 d-flex align-items-center gap-2 py-2 px-3">
            <i className="fas fa-info-circle"></i>
            <span>Clock Skew: {timeData.clockSkewOffset}ms per day</span>
          </div>
        )}
      </div>
      <TimeSettingsModal
        show={showTimeModal}
        onHide={() => setShowTimeModal(false)}
        onUpdate={handleTimeUpdate}
      />
      <ClockSkewModal
        show={showClockSkewModal}
        onHide={() => setShowClockSkewModal(false)}
        onUpdate={handleClockSkewUpdate}
        currentValue={timeData.clockSkewOffset}
      />
    </div>
  );
}