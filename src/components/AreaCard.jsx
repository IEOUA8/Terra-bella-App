import React from 'react';
import { motion } from 'framer-motion';
import { Users, XCircle } from 'lucide-react';

const AreaCard = ({ area, onSelect, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${area.color} p-6 cursor-pointer group ${!area.available ? 'opacity-50' : ''}`}
      onClick={() => area.available && onSelect(area)}
    >
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-4xl">{area.icon}</span>
          {!area.available && <XCircle className="w-6 h-6 text-red-300" />}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{area.name}</h3>
        <p className="text-white/80 text-sm mb-3">{area.description}</p>
        {!area.available && (
          <div className="mt-2 text-red-300 text-sm font-medium">
            Temporalmente no disponible
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AreaCard;