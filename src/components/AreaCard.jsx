import React from 'react';
import { motion } from 'framer-motion';
import { Clock, XCircle } from 'lucide-react';

// Map area id prefix → icon background tint
const CATEGORY_STYLE = {
  jacuzzi:  { bg: 'bg-sky-900/50',    border: 'border-sky-800/40',    text: 'text-sky-300'    },
  sauna:    { bg: 'bg-amber-900/50',  border: 'border-amber-800/40',  text: 'text-amber-300'  },
  turco:    { bg: 'bg-red-900/50',    border: 'border-red-800/40',    text: 'text-red-300'    },
  salon:    { bg: 'bg-violet-900/50', border: 'border-violet-800/40', text: 'text-violet-300' },
  bbq:      { bg: 'bg-orange-900/50', border: 'border-orange-800/40', text: 'text-orange-300' },
  coworking:{ bg: 'bg-teal-900/50',   border: 'border-teal-800/40',   text: 'text-teal-300'   },
  masaje:   { bg: 'bg-rose-900/50',   border: 'border-rose-800/40',   text: 'text-rose-300'   },
  default:  { bg: 'bg-brand-900/50',  border: 'border-brand-800/40',  text: 'text-brand-300'  },
};

function getCategoryStyle(id = '') {
  const key = Object.keys(CATEGORY_STYLE).find(k => id.startsWith(k));
  return CATEGORY_STYLE[key] || CATEGORY_STYLE.default;
}

// Extract human-readable notice from description or minNoticeDays
function getNoticeLabel(area) {
  if (area.minNoticeDays >= 5) return `${area.minNoticeDays} días de antelación`;
  if (area.minNoticeDays === 1) return '1 día de antelación';
  if (area.minNoticeHours) return `${area.minNoticeHours}h de antelación`;
  return null;
}

const AreaCard = ({ area, onSelect, index }) => {
  const style = getCategoryStyle(area.id);
  const notice = getNoticeLabel(area);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={() => area.available && onSelect(area)}
      className={[
        'terra-card terra-card-hover',
        'p-5 cursor-pointer select-none',
        'flex flex-col gap-3',
        !area.available && 'opacity-50 cursor-not-allowed pointer-events-none',
      ].filter(Boolean).join(' ')}
    >
      {/* Icon + status */}
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${style.bg} border ${style.border}`}>
          {area.icon}
        </div>
        {!area.available && (
          <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
            <XCircle className="h-3.5 w-3.5" /> No disponible
          </span>
        )}
      </div>

      {/* Name & description */}
      <div>
        <h3 className={`text-base font-semibold ${style.text} mb-0.5`}>{area.name}</h3>
        <p className="text-sm text-gray-400 leading-snug line-clamp-2">{area.description}</p>
      </div>

      {/* Footer: notice badge */}
      {notice && (
        <div className="flex items-center gap-1.5 mt-auto">
          <Clock className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs text-gray-500">{notice}</span>
        </div>
      )}
    </motion.div>
  );
};

export default AreaCard;
