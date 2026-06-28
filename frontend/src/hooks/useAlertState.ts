import { useState, useEffect, useCallback } from 'react';

export type AlertLevel = 'NORMAL' | 'WATCH' | 'WARNING' | 'ALERT' | 'RECOVERY';

interface AlertState {
  level: AlertLevel;
  flareClass: string;
  message: string;
  color: string;
  bgColor: string;
  since: Date;
}

function classifyAlert(flareClass: string, flux: number): AlertLevel {
  if (flareClass === 'X') return 'ALERT';
  if (flareClass === 'M') return 'WARNING';
  if (flareClass === 'C') return 'WATCH';
  return 'NORMAL';
}

const ALERT_CONFIG: Record<AlertLevel, { message: string; color: string; bgColor: string }> = {
  NORMAL: { message: 'Space weather conditions nominal. All ISRO systems operating normally.', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/30' },
  WATCH: { message: 'C-class flare detected. Monitor NavIC L5 signals. Minor radio blackout possible on sunlit side of Earth.', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/30' },
  WARNING: { message: 'M-class flare in progress! NavIC positioning error elevated. CARTOSAT imaging may be affected. Stand by for updates.', color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/30' },
  ALERT: { message: '⚡ X-CLASS SOLAR FLARE CONFIRMED. HF communications disrupted. RISAT-2BR1 and NavIC in HIGH RISK. Execute contingency protocols.', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/30' },
  RECOVERY: { message: 'Flare activity subsiding. Monitoring ionospheric recovery. NavIC signals expected to normalize within 30-60 minutes.', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/30' },
};

export function useAlertState(flareClass: string, flux: number) {
  const [previousLevel, setPreviousLevel] = useState<AlertLevel>('NORMAL');
  const [alertState, setAlertState] = useState<AlertState>({
    level: 'NORMAL',
    flareClass: 'A',
    message: ALERT_CONFIG.NORMAL.message,
    color: ALERT_CONFIG.NORMAL.color,
    bgColor: ALERT_CONFIG.NORMAL.bgColor,
    since: new Date(),
  });

  const playAlert = useCallback((level: AlertLevel) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const frequencies: Record<AlertLevel, number[]> = {
        NORMAL: [],
        WATCH: [440],
        WARNING: [440, 550],
        ALERT: [880, 660, 880],
        RECOVERY: [330],
      };
      const freqs = frequencies[level];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.3);
        osc.stop(ctx.currentTime + i * 0.3 + 0.25);
      });
    } catch (e) {
      console.warn('Audio alert blocked:', e);
    }
  }, []);

  useEffect(() => {
    const newLevel = classifyAlert(flareClass, flux);

    // Transition to RECOVERY if downgrading from high alert
    let finalLevel = newLevel;
    if (
      (previousLevel === 'ALERT' || previousLevel === 'WARNING') &&
      (newLevel === 'WATCH' || newLevel === 'NORMAL')
    ) {
      finalLevel = 'RECOVERY';
    }

    if (finalLevel !== previousLevel) {
      playAlert(finalLevel);
      setPreviousLevel(finalLevel);
      setAlertState({
        level: finalLevel,
        flareClass,
        message: ALERT_CONFIG[finalLevel].message,
        color: ALERT_CONFIG[finalLevel].color,
        bgColor: ALERT_CONFIG[finalLevel].bgColor,
        since: new Date(),
      });
    }
  }, [flareClass, flux, previousLevel, playAlert]);

  return alertState;
}
