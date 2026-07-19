import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { DeviceEventEmitter } from 'react-native';

export function useConsultationTimer(consultationId, role, initialElapsed = 0, initialTimerStartedAt = null, initialDoctorJoined = false, initialPatientJoined = false) {
  const { socket } = useSocket() || {};
  const [timerSeconds, setTimerSeconds] = useState(initialElapsed);
  const [isDoctorJoined, setIsDoctorJoined] = useState(initialDoctorJoined);
  const [isPatientJoined, setIsPatientJoined] = useState(initialPatientJoined);
  const [timerLastStartedAt, setTimerLastStartedAt] = useState(initialTimerStartedAt);
  const [elapsedSecondsBase, setElapsedSecondsBase] = useState(initialElapsed);

  useEffect(() => {
    if (!socket || !consultationId) return;

    socket.emit('join_consultation', { consultationId, role });

    return () => {
      socket.emit('leave_consultation', { consultationId });
    };
  }, [socket, consultationId, role]);

  useEffect(() => {
    const syncSub = DeviceEventEmitter.addListener('consultation_sync', (data) => {
      setIsDoctorJoined(data.is_doctor_joined);
      setIsPatientJoined(data.is_patient_joined);
      setElapsedSecondsBase(data.elapsed_seconds);
      setTimerLastStartedAt(data.timer_last_started_at);
      
      if (!data.timer_last_started_at) {
        setTimerSeconds(data.elapsed_seconds);
      }
    });

    return () => syncSub.remove();
  }, []);

  useEffect(() => {
    let interval;
    if (timerLastStartedAt) {
      const startMs = new Date(timerLastStartedAt).getTime();
      
      const updateTimer = () => {
        const nowMs = Date.now();
        const diff = Math.max(0, Math.floor((nowMs - startMs) / 1000));
        setTimerSeconds(elapsedSecondsBase + diff);
      };
      
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setTimerSeconds(elapsedSecondsBase);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerLastStartedAt, elapsedSecondsBase]);

  return {
    timerSeconds,
    isDoctorJoined,
    isPatientJoined
  };
}
