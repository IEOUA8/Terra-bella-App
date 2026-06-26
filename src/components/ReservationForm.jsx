import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TermsOfUse from '@/components/TermsOfUse';
import AISuggestions from '@/components/AISuggestions';
import { socialAreas } from '@/data/socialAreas';
import { convertToAmPm } from '@/lib/utils';
import useReservations from '@/hooks/useReservations';
import { useAuth } from '@/contexts/SupabaseAuthContext';

// Map area categories to icon background tints (same as AreaCard)
const CATEGORY_STYLE = {
  jacuzzi:   'bg-sky-900/50 border-sky-800/40',
  sauna:     'bg-amber-900/50 border-amber-800/40',
  turco:     'bg-red-900/50 border-red-800/40',
  salon:     'bg-violet-900/50 border-violet-800/40',
  bbq:       'bg-orange-900/50 border-orange-800/40',
  coworking: 'bg-teal-900/50 border-teal-800/40',
  masaje:    'bg-rose-900/50 border-rose-800/40',
  default:   'bg-brand-900/50 border-brand-800/40',
};

function getAreaStyle(id = '') {
  const key = Object.keys(CATEGORY_STYLE).find(k => id.startsWith(k));
  return CATEGORY_STYLE[key] || CATEGORY_STYLE.default;
}

const ReservationForm = ({ selectedArea, onBack, onConfirmReservation }) => {
  const { profile } = useAuth();
  const areaDetails = socialAreas.find(a => a.id === selectedArea.id);

  const getMinDate = useCallback(() => {
    const today = new Date();
    const noticeDays = areaDetails?.minNoticeDays || 0;
    if (noticeDays > 0) today.setDate(today.getDate() + noticeDays);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return today < now ? now.toISOString().split('T')[0] : today.toISOString().split('T')[0];
  }, [areaDetails]);

  const [selectedDate, setSelectedDate] = useState(getMinDate());
  const [selectedTime, setSelectedTime] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { loading, isTimeSlotTaken, refetch } = useReservations(profile);

  useEffect(() => { refetch(); }, [selectedDate, refetch]);
  useEffect(() => { setSelectedDate(getMinDate()); }, [getMinDate]);

  const isPastTime = (dateStr, timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const [y, mo, d] = dateStr.split('-').map(Number);
    return new Date(y, mo - 1, d, h, m) < new Date();
  };

  if (!areaDetails) {
    return (
      <div className="terra-card p-8 text-center">
        <h2 className="text-lg text-red-400 font-medium mb-2">Área no encontrada</h2>
        <Button onClick={onBack} variant="outline" className="border-surface-border mt-2">Volver</Button>
      </div>
    );
  }

  if (!termsAccepted) {
    return <TermsOfUse areaName={areaDetails.name} onAccept={() => setTermsAccepted(true)} onCancel={onBack} />;
  }

  const timeSlotsForArea = areaDetails.timeSlots || [];
  const iconStyle = getAreaStyle(areaDetails.id);

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 max-w-xl mx-auto"
    >
      {/* Back + Area header */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a áreas
      </button>

      {/* Area info card */}
      <div className="terra-card p-4 flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl border shrink-0 ${iconStyle}`}>
          {areaDetails.icon}
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{areaDetails.name}</h2>
          <p className="text-sm text-gray-400 leading-snug">{areaDetails.description}</p>
        </div>
      </div>

      {/* Date + Time selection */}
      <div className="terra-card p-5 space-y-5">
        {/* Date */}
        <div className="space-y-2">
          <label htmlFor="reservation-date" className="block text-sm font-medium text-gray-300">
            Fecha de reserva
          </label>
          <input
            id="reservation-date"
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
            min={getMinDate()}
            className="w-full px-4 py-3 rounded-lg bg-[#0C1412] border border-surface-border text-white focus:outline-none focus:border-brand-600 text-base"
          />
        </div>

        {/* AI suggestions */}
        <AISuggestions
          timeSlots={timeSlotsForArea}
          isTimeSlotTaken={isTimeSlotTaken}
          onSelectTime={setSelectedTime}
          areaId={areaDetails.id}
          date={selectedDate}
        />

        {/* Time slots */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Horario disponible</label>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-brand-400" />}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {timeSlotsForArea.map((time) => {
              const isTaken = isTimeSlotTaken(areaDetails.id, selectedDate, time);
              const isPast  = isPastTime(selectedDate, time);
              const isDisabled = isTaken || isPast || loading;
              const isSelected = selectedTime === time;

              return (
                <button
                  key={time}
                  onClick={() => !isDisabled && setSelectedTime(time)}
                  disabled={isDisabled}
                  className={[
                    'relative h-12 rounded-lg border text-sm font-medium transition-colors',
                    isSelected
                      ? 'bg-brand-600 border-brand-500 text-white'
                      : isDisabled
                      ? 'bg-[#0C1412] border-surface-border text-gray-600 cursor-not-allowed'
                      : 'bg-[#0C1412] border-surface-border text-gray-300 hover:border-brand-600 hover:text-white',
                  ].join(' ')}
                >
                  <span className={isDisabled ? 'opacity-40' : ''}>{convertToAmPm(time)}</span>
                  {(isTaken || isPast) && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                        {isTaken ? 'Ocupado' : 'Pasado'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected summary */}
        {selectedTime && (
          <div className="flex items-center gap-2 text-sm text-brand-300 bg-brand-900/30 border border-brand-800/50 rounded-lg px-3 py-2">
            <Clock className="h-4 w-4 shrink-0" />
            Seleccionado: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })} a las {convertToAmPm(selectedTime)}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-surface-border">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1 border-surface-border text-gray-400 hover:text-white hover:border-gray-500"
          >
            <XCircle className="w-4 h-4 mr-1.5" /> Cancelar
          </Button>
          <Button
            onClick={() => onConfirmReservation(selectedArea, selectedDate, selectedTime)}
            disabled={!selectedTime || loading}
            className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-surface-card disabled:text-gray-600 text-white font-semibold"
          >
            {loading
              ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              : <CheckCircle className="w-4 h-4 mr-1.5" />
            }
            Confirmar
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ReservationForm;
