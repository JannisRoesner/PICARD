import React, { createContext, useContext, useState, useEffect } from 'react';

const TimerContext = createContext();

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export const TimerProvider = ({ children }) => {
  const [timerState, setTimerState] = useState({
    isRunning: false,
    remainingTime: 0,
    totalTime: 0,
    startTime: null,
    currentProgrammpunkt: null
  });

  const [activeProgrammpunkt, setActiveProgrammpunktState] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Aktuelle Uhrzeit aktualisieren
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Timer-Logik
  useEffect(() => {
    if (!timerState.isRunning) return;

    const timerInterval = setInterval(() => {
      setTimerState(prev => {
        const elapsed = Math.floor((Date.now() - prev.startTime) / 1000);
        const remaining = Math.max(0, prev.totalTime - elapsed);
        
        if (remaining <= 0) {
          // Timer beendet - Browser-Benachrichtigung
          if (Notification.permission === 'granted') {
            new Notification('PICARD Timer', {
              body: `Programmpunkt "${prev.currentProgrammpunkt?.name || 'Unbekannt'}" ist beendet!`,
              icon: '/favicon.ico'
            });
          }
          
          // Audio-Benachrichtigung
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
            audio.play();
          } catch (e) {
            console.log('Audio-Benachrichtigung nicht verfügbar');
          }
          
          return {
            ...prev,
            isRunning: false,
            remainingTime: 0
          };
        }
        
        // Warnung bei 75% und 90% der Zeit
        if (remaining === Math.floor(prev.totalTime * 0.25) || remaining === Math.floor(prev.totalTime * 0.1)) {
          if (Notification.permission === 'granted') {
            new Notification('PICARD Timer', {
              body: `Programmpunkt "${prev.currentProgrammpunkt?.name || 'Unbekannt'}" läuft in ${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')} ab!`,
              icon: '/favicon.ico'
            });
          }
        }
        
        return {
          ...prev,
          remainingTime: remaining
        };
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [timerState.isRunning]);

  const startTimer = (duration, programmpunkt = null) => {
    const newTimerState = {
      isRunning: true,
      remainingTime: duration,
      totalTime: duration,
      startTime: Date.now(),
      currentProgrammpunkt: programmpunkt
    };
    
    setTimerState(newTimerState);
    
    // Timer-Event an alle Clients senden
    const socket = window.socket;
    if (socket) {
      socket.emit('timerStart', {
        duration,
        programmpunkt,
        remainingTime: duration
      });
    }
  };

  const setActiveProgrammpunkt = (programmpunkt) => {
    setActiveProgrammpunktState(programmpunkt);
    
    // Automatisch Timer starten wenn ein Programmpunkt aktiviert wird
    if (programmpunkt && programmpunkt.dauer) {
      startTimer(programmpunkt.dauer, programmpunkt);
    } else {
      stopTimer();
    }
  };

  // Socket.IO Event für Timer-Synchronisation
  useEffect(() => {
    const socket = window.socket;
    if (!socket) return;

    const handleTimerUpdate = (data) => {
      if (data.type === 'timerStart') {
        setTimerState({
          isRunning: true,
          remainingTime: data.duration,
          totalTime: data.duration,
          startTime: Date.now() - ((data.duration - data.remainingTime) * 1000),
          currentProgrammpunkt: data.programmpunkt
        });
        setActiveProgrammpunktState(data.programmpunkt);
      } else if (data.type === 'timerStop') {
        setTimerState({
          isRunning: false,
          remainingTime: 0,
          totalTime: 0,
          startTime: null,
          currentProgrammpunkt: null
        });
        setActiveProgrammpunktState(null);
      }
    };

    socket.on('timerUpdate', handleTimerUpdate);

    return () => {
      socket.off('timerUpdate', handleTimerUpdate);
    };
  }, []);

  const stopTimer = () => {
    const newTimerState = {
      isRunning: false,
      remainingTime: 0,
      totalTime: 0,
      startTime: null,
      currentProgrammpunkt: null
    };
    
    setTimerState(newTimerState);
    
    // Timer-Stop-Event an alle Clients senden
    const socket = window.socket;
    if (socket) {
      socket.emit('timerStop');
    }
  };

  const pauseTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: false
    }));
  };

  const resumeTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      startTime: Date.now() - ((prev.totalTime - prev.remainingTime) * 1000)
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrentTime = (date) => {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getProgressPercentage = () => {
    if (timerState.totalTime === 0) return 0;
    return ((timerState.totalTime - timerState.remainingTime) / timerState.totalTime) * 100;
  };

  const getTimerColor = () => {
    const progress = getProgressPercentage();
    if (progress > 90) return 'danger';
    if (progress > 75) return 'warning';
    return 'normal';
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  const value = {
    timerState,
    currentTime,
    activeProgrammpunkt,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    setActiveProgrammpunkt,
    formatTime,
    formatCurrentTime,
    getProgressPercentage,
    getTimerColor,
    requestNotificationPermission
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}; 