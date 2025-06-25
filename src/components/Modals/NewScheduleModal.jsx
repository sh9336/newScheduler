'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import styles from '../../styles/ScheduleModals.module.css';

   // Base URL for API
  const API_BASE_URL = process.env.NODE_ENV === 'development'
    ? '/api/proxy' // Use proxy in development
    : '';

const NewScheduleModal = ({ show, onHide, onCreate, onNotification, assets, scheduleActions, editData }) => {
  const [formData, setFormData] = useState({
    Id: '',
    Name: '',
    Action: '',
    AssetId: '',
    CronSpec: '',
    DurationInSec: '',
    TaskType: 'Default',
    scheduleType: 'Daily',
    weeklyDay: '*',
    monthlyDay: '1',
    annualMonth: '1',
    timeOfDay: '11:00:00',
    durationMinutes: '',
    durationSeconds: ''
  });
  const [error, setError] = useState(null);

  // Update form data when editData changes
  useEffect(() => {
    if (editData) {
      // Convert duration from seconds to minutes and seconds
      const totalSeconds = parseInt(editData.DurationInSec) || 0;
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      setFormData({
        Id: editData.Id,
        Name: editData.Name,
        Action: editData.Action,
        AssetId: editData.AssetId,
        DurationInSec: editData.DurationInSec,
        TaskType: editData.TaskType || 'Default',
        scheduleType: editData.scheduleType,
        weeklyDay: editData.weeklyDay,
        monthlyDay: editData.monthlyDay,
        annualMonth: editData.annualMonth,
        timeOfDay: editData.timeOfDay,
        durationMinutes: minutes.toString(),
        durationSeconds: seconds.toString().padStart(2, '0')
      });
    } else {
      // Reset form
      setFormData({
        Id: '',
        Name: '',
        Action: '',
        AssetId: '',
        CronSpec: '',
        DurationInSec: '',
        TaskType: 'Default',
        scheduleType: 'Daily',
        weeklyDay: '*',
        monthlyDay: '1',
        annualMonth: '1',
        timeOfDay: '11:00:00',
        durationMinutes: '',
        durationSeconds: ''
      });
    }
  }, [editData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle duration inputs
    if (name === 'durationMinutes' || name === 'durationSeconds') {
      // Only allow numbers and empty string
      if (value === '' || /^\d*$/.test(value)) {
        // For seconds, ensure it's between 0-59
        if (name === 'durationSeconds' && value !== '' && parseInt(value) > 59) {
          return;
        }
        setFormData(prev => {
          const newData = { ...prev, [name]: value };
          // Calculate total seconds
          const minutes = parseInt(newData.durationMinutes) || 0;
          const seconds = parseInt(newData.durationSeconds) || 0;
          newData.DurationInSec = (minutes * 60 + seconds).toString();
          return newData;
        });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const generateCronExpression = () => {
    const [hours, minutes, seconds] = formData.timeOfDay.split(':');
    let cronExp = '';
  
    // Debug logging
    console.log('=== CRON DEBUG ===');
    console.log('Schedule Type:', formData.scheduleType);
    console.log('Time of Day:', formData.timeOfDay);
    console.log('Parsed time:', { hours, minutes, seconds });
    
    if (formData.scheduleType === 'Annual') {
      console.log('Monthly Day (raw):', formData.monthlyDay);
      console.log('Annual Month (raw):', formData.annualMonth);
      console.log('Monthly Day (parsed):', formData.monthlyDay === 'L' ? 'L' : parseInt(formData.monthlyDay));
      console.log('Annual Month (parsed):', parseInt(formData.annualMonth));
    }
  
    switch (formData.scheduleType) {
      case 'Daily':
        cronExp = `${seconds || '00'} ${minutes} ${hours} * * * `;
        break;
      case 'Weekly':
        cronExp = `${seconds || '00'} ${minutes} ${hours} * * ${formData.weeklyDay} `;
        break;
      case 'Monthly':
        const monthDay = formData.monthlyDay === 'L' ? 'L' : parseInt(formData.monthlyDay);
        cronExp = `${seconds || '00'} ${minutes} ${hours} ${monthDay} * * `;
        break;
      case 'Annual':
        // Add extra validation for annual
        const day = formData.monthlyDay === 'L' ? 'L' : parseInt(formData.monthlyDay);
        const month = parseInt(formData.annualMonth);
        
        // Validate parsed values
        if (day !== 'L' && (isNaN(day) || day < 1 || day > 31)) {
          console.error('Invalid day value:', day);
          throw new Error(`Invalid day value: ${day}`);
        }
        
        if (isNaN(month) || month < 1 || month > 12) {
          console.error('Invalid month value:', month);
          throw new Error(`Invalid month value: ${month}`);
        }
        
        // Use 1-based month (1-12) as expected by the API
        cronExp = `${seconds || '00'} ${minutes} ${hours} ${day} ${month} * `;
        break;
      default:
        cronExp = `${seconds || '00'} ${minutes} ${hours} * * * `;
    }
    
    console.log('Generated cron expression:', cronExp);
    console.log('Cron expression length:', cronExp.length);
    console.log('Cron expression fields:', cronExp.split(' '));
    console.log('=== END DEBUG ===');
    
    return cronExp;
  };

  const handleSubmit = async () => {
    // Extra safety: check all required fields for validity
    if (!formData.Name || typeof formData.Name !== 'string' || formData.Name.trim() === '' ||
        !formData.Action || typeof formData.Action !== 'string' || formData.Action.trim() === '' ||
        !formData.AssetId || typeof formData.AssetId !== 'string' || formData.AssetId.trim() === '' ||
        !formData.timeOfDay || typeof formData.timeOfDay !== 'string' || formData.timeOfDay.trim() === '' ||
        (editData && (!formData.Id || typeof formData.Id !== 'string' || formData.Id.trim() === ''))
    ) {
      if (onNotification) {
        onNotification('Invalid or missing required fields. Please check your input.', 'warning');
      }
      return;
    }

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const cronSpecFull = generateCronExpression();
        const formDataToSend = new FormData();
        
        if (editData) {
          formDataToSend.append('Id', formData.Id);
        }
        formDataToSend.append('Name', formData.Name);
        formDataToSend.append('Action', formData.Action);
        formDataToSend.append('AssetId', formData.AssetId);
        formDataToSend.append('CronSpec', cronSpecFull);
        formDataToSend.append('DurationInSec', formData.DurationInSec || '0');
        formDataToSend.append('TaskType', formData.TaskType);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(
            `${API_BASE_URL}${editData ? '/updateSchedule' : '/newSchedule'}`,
            {
              method: 'POST',
              body: formDataToSend,
              credentials: 'include',
              
            }
          );

        // const response = await fetch(editData ? '/api/updateSchedule' : '/api/newSchedule', {
        //   method: 'POST',
        //   body: formDataToSend,
        //   signal: controller.signal
        // });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to ${editData ? 'update' : 'create'} schedule`);
        }

        const result = await response.json();

        // Clear form
        setFormData({
          Id: '',
          Name: '',
          Action: '',
          AssetId: '',
          CronSpec: '',
          DurationInSec: '',
          TaskType: 'Default',
          scheduleType: 'Daily',
          weeklyDay: '*',
          monthlyDay: '1',
          annualMonth: '1',
          timeOfDay: '11:00:00',
          durationMinutes: '',
          durationSeconds: ''
        });

        // Call parent handlers
        if (onCreate) onCreate(result);
        if (onNotification) onNotification(`Schedule ${editData ? 'updated' : 'created'} successfully!`, 'success');
        onHide();
        return; // Success, exit the function

      } catch (error) {
        console.error(`Error ${editData ? 'updating' : 'creating'} schedule (attempt ${retryCount + 1}/${maxRetries}):`, error);
        
        if (error.name === 'AbortError') {
          console.error('Request timed out');
          if (onNotification) {
            onNotification('Request timed out. Please try again.', 'error');
          }
        } else if (error.message.includes('Failed to connect')) {
          console.error('Connection failed');
          if (onNotification) {
            onNotification('Failed to connect to scheduler service. Please check if the service is running.', 'error');
          }
        }

        retryCount++;
        if (retryCount === maxRetries) {
          if (onNotification) {
            onNotification(`Failed to ${editData ? 'update' : 'create'} schedule after ${maxRetries} attempts. Please try again later.`, 'error');
          }
          return;
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount), 5000)));
      }
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className={styles.modalHeader}>
        <Modal.Title className={styles.modalTitle}>
          {editData ? 'Edit Schedule' : 'Create New Schedule'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalBody}>
        {error && <p className="text-danger">{error}</p>}
        
        <Form>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Name</label>
            <input
              type="text"
              name="Name"
              value={formData.Name}
              onChange={handleInputChange}
              placeholder="Enter schedule name"
              className={styles.formControl}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Action</label>
            <select
              name="Action"
              value={formData.Action}
              onChange={handleInputChange}
              className={styles.formSelect}
            >
              <option value="">Select an action</option>
              {Object.values(scheduleActions).map((action) => (
                <option key={action.Name} value={action.Name}>
                  {action.OptionText}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Configure the Schedule</label>
            <div className={styles.scheduleTypeGroup}>
              {['Daily', 'Weekly', 'Monthly', 'Annual'].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`${styles.scheduleTypeButton} ${formData.scheduleType === type ? styles.active : ''}`}
                  name="scheduleType"
                  value={type}
                  onClick={(e) => handleInputChange(e)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {formData.scheduleType === 'Weekly' && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Day of the Week</label>
              <select
                name="weeklyDay"
                value={formData.weeklyDay}
                onChange={handleInputChange}
                className={styles.formSelect}
              >
                <option value="*">Everyday</option>
                <option value="2,3,4,5,6">Weekdays (Mon-Fri)</option>
                <option value="1,7">Weekends (Sat-Sun)</option>
                <option value="2">Monday</option>
                <option value="3">Tuesday</option>
                <option value="4">Wednesday</option>
                <option value="5">Thursday</option>
                <option value="6">Friday</option>
                <option value="7">Saturday</option>
                <option value="1">Sunday</option>
              </select>
            </div>
          )}

          {(formData.scheduleType === 'Monthly' || formData.scheduleType === 'Annual') && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Day of the Month</label>
              <select
                name="monthlyDay"
                value={formData.monthlyDay}
                onChange={handleInputChange}
                className={styles.formSelect}
              >
                <option value="L">Last Day</option>
                {[...Array(31)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}
                    {i >= 29 ? ' (when applicable)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.scheduleType === 'Annual' && (
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Month</label>
              <select
                name="annualMonth"
                value={formData.annualMonth}
                onChange={handleInputChange}
                className={styles.formSelect}
              >
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Time of Day</label>
            <input
              type="time"
              name="timeOfDay"
              value={formData.timeOfDay}
              onChange={handleInputChange}
              step="1"
              className={styles.timeInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Track</label>
            <select
              name="AssetId"
              value={formData.AssetId}
              onChange={handleInputChange}
              className={styles.formSelect}
            >
              <option value="">Select a track</option>
              {assets.map((asset) => (
                <option key={asset.Id} value={asset.Id}>
                  {asset.Name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Duration</label>
            <div className={styles.durationGroup}>
              <input
                type="text"
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleInputChange}
                placeholder="0"
                className={styles.durationInput}
                maxLength="3"
              />
              <span className={styles.durationLabel}>min</span>
              <input
                type="text"
                name="durationSeconds"
                value={formData.durationSeconds}
                onChange={handleInputChange}
                placeholder="00"
                className={styles.durationInput}
                maxLength="2"
              />
              <span className={styles.durationLabel}>sec</span>
            </div>
            <p className={styles.helpText}>
              Leave blank for full track duration
            </p>
          </div>
        </Form>
      </Modal.Body>
      
      <Modal.Footer className={styles.modalFooter}>
        <button className={styles.buttonSecondary} onClick={onHide}>
          Cancel
        </button>
        <button className={styles.buttonPrimary} onClick={handleSubmit}>
          {editData ? 'Update Schedule' : 'Create Schedule'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default NewScheduleModal;