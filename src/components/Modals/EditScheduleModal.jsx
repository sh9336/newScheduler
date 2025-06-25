'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import styles from '../../styles/ScheduleModals.module.css';


   // Base URL for API
  const API_BASE_URL = process.env.NODE_ENV === 'development'
    ? '/api/proxy' // Use proxy in development
    : '';

const EditScheduleModal = ({ show, onHide, onUpdate, onNotification, assets, scheduleActions, schedule }) => {
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

  // Update form data when schedule changes
  useEffect(() => {
    if (schedule) {
      // Parse the CronSpec to get schedule type and time fields
      const cronParts = (schedule.CronSpec || '0 0 0 * * *').split(' ');
      const [seconds, minutes, hours, dayOfMonth, month, dayOfWeek] = cronParts;
      
      let scheduleType = 'Daily';
      let weeklyDay = '*';
      let monthlyDay = '1';
      let annualMonth = '1';
      
      // Determine schedule type from CronSpec
      if (dayOfWeek !== '*') {
        scheduleType = 'Weekly';
        weeklyDay = dayOfWeek;
      } else if (month !== '*') {
        scheduleType = 'Annual';
        monthlyDay = dayOfMonth;
        annualMonth = month;
      } else if (dayOfMonth !== '*') {
        scheduleType = 'Monthly';
        monthlyDay = dayOfMonth;
      }

      // Convert duration from seconds to minutes and seconds
      const totalSeconds = parseInt(schedule.DurationInSec) || 0;
      const durationMinutes = Math.floor(totalSeconds / 60);
      const durationSeconds = totalSeconds % 60;

      setFormData({
        Id: schedule.Id || '',
        Name: schedule.Name || '',
        Action: schedule.Action || '',
        AssetId: schedule.AssetId || '',
        DurationInSec: schedule.DurationInSec || '',
        TaskType: schedule.TaskType || 'Default',
        scheduleType: scheduleType,
        weeklyDay: weeklyDay,
        monthlyDay: monthlyDay,
        annualMonth: annualMonth,
        timeOfDay: `${hours || '00'}:${minutes || '00'}:${seconds || '00'}`,
        durationMinutes: durationMinutes.toString(),
        durationSeconds: durationSeconds.toString().padStart(2, '0')
      });
    }
  }, [schedule]);

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
    const [hours, minutes] = formData.timeOfDay.split(':');
    let cronExp = '';

    switch (formData.scheduleType) {
      case 'Daily':
        cronExp = `00 ${minutes} ${hours} * * *`;
        break;
      case 'Weekly':
        cronExp = `00 ${minutes} ${hours} * * ${formData.weeklyDay}`;
        break;
      case 'Monthly':
        const monthDay = formData.monthlyDay === 'L' ? 'L' : parseInt(formData.monthlyDay);
        cronExp = `00 ${minutes} ${hours} ${monthDay} * *`;
        break;
      case 'Annual':
        const day = parseInt(formData.monthlyDay);
        cronExp = `00 ${minutes} ${hours} ${day} ${formData.annualMonth} *`;
        break;
      default:
        cronExp = `00 ${minutes} ${hours} * * *`;
    }
    console.log('Generated cron expression:', cronExp);
    return cronExp;
  };

  const handleSubmit = async () => {
    // Extra safety: check all required fields for validity
    if (!formData.Name || typeof formData.Name !== 'string' || formData.Name.trim() === '' ||
        !formData.Action || typeof formData.Action !== 'string' || formData.Action.trim() === '' ||
        !formData.AssetId || typeof formData.AssetId !== 'string' || formData.AssetId.trim() === '' ||
        !formData.timeOfDay || typeof formData.timeOfDay !== 'string' || formData.timeOfDay.trim() === '' ||
        !formData.Id || typeof formData.Id !== 'string' || formData.Id.trim() === ''
    ) {
      if (onNotification) {
        onNotification('Invalid or missing required fields. Please check your input.', 'warning');
      }
      return;
    }

    try {
      const cronSpecFull = generateCronExpression();
      const formDataToSend = new FormData();
      
      formDataToSend.append('Id', formData.Id);
      formDataToSend.append('Name', formData.Name);
      formDataToSend.append('Action', formData.Action);
      formDataToSend.append('AssetId', formData.AssetId);
      formDataToSend.append('CronSpec', cronSpecFull);
      formDataToSend.append('DurationInSec', formData.DurationInSec || '0');
      formDataToSend.append('TaskType', formData.TaskType);

       const response = await fetch(`${API_BASE_URL}/updateSchedule`, {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include', // Send cookies
      });

      

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update schedule');
      }

      const result = await response.json();

      // Call parent handlers
      if (onUpdate) onUpdate(result);
      if (onNotification) onNotification('Schedule updated successfully!', 'success');
      onHide();
    } catch (error) {
      console.error('Error updating schedule:', error);
      if (onNotification) {
        onNotification(error.message, 'error');
      }
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className={styles.modalHeader}>
        <Modal.Title className={styles.modalTitle}>Edit Schedule</Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalBody}>
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
          Update Schedule
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditScheduleModal;
