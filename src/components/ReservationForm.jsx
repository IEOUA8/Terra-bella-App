import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TermsOfUse from '@/components/TermsOfUse';
import AISuggestions from '@/components/AISuggestions';
import { socialAreas } from '@/data/socialAreas';
import { convertToAmPm } from '@/lib/utils';
import useReservations from '@/hooks/useReservations';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ReservationForm = ({ selectedArea, onBack, onConfirmReservation }) => {
  const { profile } = useAuth();
  const areaDetails = socialAreas.find(a => a.id === selectedArea.id);
  
  const getMinDate = useCallback(() => {
    const today = new Date();
    const noticeDays = areaDetails?.minNoticeDays || 0;
    if (noticeDays > 0) {
      today.setDate(today.getDate() + noticeDays);
    }
    const now = new Date();
    now.setHours(0,0,0,0);
    return today < now ? now.toISOString().split('T')[0] : today.toISOString().split('T')[0];
  }, [areaDetails]);

  const [selectedDate, setSelectedDate] = useState(getMinDate());
  const [selectedTime, setSelectedTime] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { loading, isTimeSlotTaken, refetch } = useReservations(profile);

  useEffect(() => {
    refetch();
  }, [selectedDate, refetch]);
  
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedTime('');
  };
  
  const handleConfirm = () => {
    onConfirmReservation(selectedArea, selectedDate, selectedTime);
  };
  
  useEffect(() => {
    setSelectedDate(getMinDate());
  }, [getMinDate]);

  // Helper to check if a time slot is in the past
  const isPastTime = (dateStr, timeStr) => {
    const now = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Create date object in local time
    const slotDate = new Date(year, month - 1, day, hours, minutes);
    return slotDate < now;
  };

  if (!areaDetails) {
    return (
        <div className="text-center p-8 bg-red-900/20 rounded-lg">
            <h2 className="text-xl text-red-400">Error: Área no encontrada.</h2>
            <p className="text-slate-300 mt-2">No se pudieron cargar los detalles para esta área.</p>
            <Button onClick={onBack} className="mt-4">Volver al Dashboard</Button>
        </div>
    )
  }

  if (!termsAccepted) {
    return (
      <TermsOfUse
        areaName={areaDetails.name}
        onAccept={() => setTermsAccepted(true)}
        onCancel={onBack}
      />
    );
  }

  const timeSlotsForArea = areaDetails.timeSlots || [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="text-white hover:bg-white/10 border-purple-400/50"
        >
          ← Volver
        </Button>
        <h2 className="text-2xl font-bold">Reservar {areaDetails.name}</h2>
      </div>

      <div className={`bg-gradient-to-br ${areaDetails.color} rounded-2xl p-6 text-white shadow-lg`}>
        <div className="flex items-center space-x-4">
          <span className="text-4xl">{areaDetails.icon}</span>
          <div>
            <h3 className="text-xl font-bold">{areaDetails.name}</h3>
            <p className="opacity-90 text-sm">{areaDetails.description}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 space-y-6">
        <div>
          <label htmlFor="reservation-date" className="block text-sm font-medium mb-2">Selecciona la Fecha</label>
          <input
            id="reservation-date"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            min={getMinDate()}
            className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Selecciona el Horario</label>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
          </div>
          <AISuggestions
            timeSlots={timeSlotsForArea}
            isTimeSlotTaken={isTimeSlotTaken}
            onSelectTime={setSelectedTime}
            areaId={areaDetails.id}
            date={selectedDate}
          />
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {timeSlotsForArea.map((time) => {
              const isTaken = isTimeSlotTaken(areaDetails.id, selectedDate, time);
              const isPast = isPastTime(selectedDate, time);
              const isDisabled = isTaken || isPast || loading;

              return (
                <button
                  key={time}
                  onClick={() => !isDisabled && setSelectedTime(time)}
                  disabled={isDisabled}
                  className={`p-3 rounded-lg border text-center transition-all duration-200 ${
                    selectedTime === time
                      ? 'bg-blue-500 border-blue-400 text-white ring-2 ring-white/50'
                      : isDisabled
                      ? 'bg-slate-800/50 border-slate-700/50 text-slate-500 cursor-not-allowed relative'
                      : 'bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50'
                  }`}
                >
                  {isTaken && <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-red-400 bg-black/40 rounded-lg">Ocupado</div>}
                  {isPast && !isTaken && <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-400 bg-black/40 rounded-lg">Pasado</div>}
                  {convertToAmPm(time)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/20">
          <Button
            onClick={onBack}
            variant="outline"
            className="w-full sm:w-auto flex-1 bg-transparent border-red-500 text-red-400 hover:bg-red-500/20 hover:text-red-300"
          >
            <XCircle className="w-5 h-5 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedTime || loading}
            className="w-full sm:w-auto flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 rounded-lg transition-all"
          >
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
            Confirmar Reserva
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ReservationForm;