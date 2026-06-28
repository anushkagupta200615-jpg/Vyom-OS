import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Eye, AlertTriangle, RefreshCw } from 'lucide-react';
import type { AlertLevel } from '../hooks/useAlertState';

interface AlertBannerProps {
  level: AlertLevel;
  message: string;
  color: string;
  bgColor: string;
  since: Date;
}

const LEVEL_ICONS: Record<AlertLevel, React.ReactNode> = {
  NORMAL: <ShieldCheck className="w-4 h-4" />,
  WATCH: <Eye className="w-4 h-4" />,
  WARNING: <AlertTriangle className="w-4 h-4" />,
  ALERT: <ShieldAlert className="w-4 h-4" />,
  RECOVERY: <RefreshCw className="w-4 h-4" />,
};

const AlertBanner: React.FC<AlertBannerProps> = ({ level, message, color, bgColor, since }) => {
  const isActive = level !== 'NORMAL';
  const timeSince = Math.floor((Date.now() - since.getTime()) / 60000);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={level}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        className={`w-full border rounded-lg px-4 py-2 mb-4 flex items-center gap-3 ${bgColor} ${
          level === 'ALERT' ? 'animate-pulse' : ''
        }`}
      >
        <span className={`${color} flex-shrink-0`}>
          {LEVEL_ICONS[level]}
        </span>
        <div className="flex-1 min-w-0">
          <span className={`text-xs font-bold uppercase tracking-widest ${color} mr-2`}>
            {level}
          </span>
          <span className="text-xs text-slate-400 truncate">{message}</span>
        </div>
        <div className="flex-shrink-0 text-right">
          <span className="text-[10px] text-slate-500 block">IST {since.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}</span>
          {isActive && <span className="text-[10px] text-slate-600">{timeSince}m ago</span>}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AlertBanner;
