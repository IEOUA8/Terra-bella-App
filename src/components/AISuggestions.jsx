import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock } from 'lucide-react';

const AISuggestions = ({ timeSlots, isTimeSlotTaken, onSelectTime, areaId, date }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestedTimes = useMemo(() => {
    if (!showSuggestions) return [];
    
    const availableSlots = timeSlots.filter(time => !isTimeSlotTaken(areaId, date, time));
    
    return availableSlots.slice(0, 3);
  }, [showSuggestions, timeSlots, isTimeSlotTaken, areaId, date]);

  const handleSuggestionClick = (time) => {
    onSelectTime(time);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        onClick={() => setShowSuggestions(!showSuggestions)}
        className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white border-purple-400/50 hover:from-purple-600 hover:to-fuchsia-600 transition-all"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {showSuggestions ? 'Ocultar sugerencias' : 'Ver sugerencias IA'}
      </Button>
      
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2">
              {suggestedTimes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {suggestedTimes.map(time => (
                    <Button
                      key={time}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSuggestionClick(time)}
                      className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white hover:from-blue-500/30 hover:to-purple-500/30"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      {time}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No hay horarios sugeridos disponibles para esta fecha.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AISuggestions;