import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FileText, XCircle, CheckCircle } from 'lucide-react';

const TermsOfUse = ({ areaName, onAccept, onCancel }) => {
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const scrollRef = useRef(null);

  const checkScroll = () => {
    const element = scrollRef.current;
    if (element) {
      const isScrollable = element.scrollHeight > element.clientHeight;
      if (!isScrollable) {
        setIsScrolledToEnd(true);
      } else {
        const isAtEnd = element.scrollTop + element.clientHeight >= element.scrollHeight - 5;
        if (isAtEnd) {
          setIsScrolledToEnd(true);
        }
      }
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkScroll();
    }, 100); 
    
    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', checkScroll);
    }

    return () => {
      clearTimeout(timeoutId);
      if (element) {
        element.removeEventListener('scroll', checkScroll);
      }
    };
  }, []);
  
  const isBbqArea = areaName === 'BBQ 1' || areaName === 'BBQ 2';
  const isCoworkingArea = areaName === 'Coworking 1' || areaName === 'Coworking 2';
  const isSocialHall = areaName === 'Salón de Eventos';
  const isJacuzziArea = areaName === 'Jacuzzi 1' || areaName === 'Jacuzzi 2';
  const isSpaArea = areaName === 'Sauna' || areaName === 'Turco' || areaName === 'Sala de Masaje';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-white/20"
    >
      <div className="flex items-center mb-4">
        <FileText className="w-6 h-6 mr-3 text-blue-400" />
        <h2 className="text-2xl font-bold">Acuerdo de Uso para: {areaName}</h2>
      </div>
      <div
        ref={scrollRef}
        className="h-64 overflow-y-auto pr-4 space-y-4 text-gray-300 text-sm border-y border-white/20 py-4 custom-scrollbar"
      >
        <p className="font-semibold text-white">1. Responsabilidad del Residente:</p>
        <p>El residente que realiza la reserva es el único responsable del área social durante el horario reservado. Esto incluye la supervisión de sus invitados, el cuidado de las instalaciones y el cumplimiento de todas las normativas del condominio.</p>
        
        <p className="font-semibold text-white">2. Cuidado de las Instalaciones:</p>
        <p>El área debe ser entregada en las mismas condiciones en que fue recibida. Cualquier daño a la propiedad, mobiliario o equipo será responsabilidad del residente y deberá ser reportado inmediatamente a la administración. Los costos de reparación o reemplazo serán cargados al residente.</p>
        
        <p className="font-semibold text-white">3. Limpieza:</p>
        <p>Es obligatorio dejar el área limpia y ordenada. Esto incluye recoger toda la basura, limpiar cualquier derrame y asegurarse de que todos los equipos (como parrillas de BBQ) estén apagados y limpios. El incumplimiento resultará en una multa de limpieza.</p>
        
        <p className="font-semibold text-white">4. Normas de Convivencia:</p>
        <p>Se debe respetar a los demás residentes en todo momento. El volumen de la música debe ser moderado y cumplir con los horarios establecidos por el condominio. No se permiten comportamientos que alteren la paz y la tranquilidad de la comunidad.</p>
        
        <p className="font-semibold text-white">5. Capacidad Máxima:</p>
        <p>No se debe exceder la capacidad máxima de personas permitida para el área social. El residente es responsable de controlar el número de sus invitados.</p>
        
        <p className="font-semibold text-white">6. Sanciones:</p>
        <p>El incumplimiento de cualquiera de estas normas puede resultar en sanciones, que van desde multas económicas hasta la suspensión del derecho a reservar áreas sociales. La reincidencia será tratada con mayor severidad.</p>

        {isSpaArea && (
          <div className="space-y-4 mt-4 pt-4 border-t border-white/10">
             <ol className="list-decimal list-inside space-y-2">
                <li>Los espacios del SPA/sauna/turco son de acceso y uso múltiple mixto para el uso de los propietarios y/o residentes permanentes, por esta razón y por la sana convivencia es obligatorio el uso de la vestimenta adecuada: camiseta y pantaloneta o vestido de Baño.</li>
                <li>El uso de SPA es exclusivo para actividades pasivas de bienestar, que no generen ruido ni que perturben la tranquilidad de los demás usuarios.</li>
                <li>El uso del sauna, turco, sala de masajes y salas de relajación se asignarán con previa solicitud a la administración o a la persona asignada por esta, con un día de antelación por parte de cualquier propietario y/o residente permanente, pero no podrán utilizarse por más de una (1) hora consecutiva, a menos que no esté demandando su uso por otro propietario y/o residente.</li>
                <li>El ingreso es para personas mayores de edad exclusivamente.</li>
                <li>Deberán llevar toalla para utilizar durante su permanencia.</li>
                <li>Los objetos personales se encuentran bajo responsabilidad de sus propietarios.</li>
                <li>Tener especial cuidado en la manipulación de los muebles, accesorios, cojinería, tapetes y elementos de decoración.</li>
                <li>Seguir en todo momento las indicaciones del personal de administración.</li>
                <li>Los objetos del SPA deben permanecer en el espacio y no se permite bajo ninguna circunstancia sacarlos del mismo.</li>
                <li>No se permite el consumo de alimentos y medicamentos.</li>
                <li>No se permite fumar, el consumo de bebidas embriagantes y sustancias alucinógenas.</li>
                <li>Únicamente está permitido el consumo de bebidas hidratantes en termos, botellas o envases adecuados.</li>
                <li>No se permite el ingreso de mascotas.</li>
                <li>El uso de la música está permitido de acuerdo con la actividad que se realiza a bajo volumen.</li>
                <li>Los visitantes durante su permanencia deberán estar acompañados en todo momento por el propietario y/o residente que lo invitó.</li>
                <li>Se deberá reacomodar los elementos utilizados.</li>
                <li>El espacio debe quedar limpio y en las mismas condiciones en las que los recibió bajo las indicaciones técnicas del personal de administración.</li>
            </ol>
            <p className="font-bold text-white">4.1.8 SPA/SAUNA - TURCO</p>
          </div>
        )}

        {isJacuzziArea && (
          <div className="space-y-4 mt-4 pt-4 border-t border-white/10">
            <p className="font-semibold text-white">Horario de uso: 8:00 a.m. a 8:00 p.m.</p>
            <ol className="list-decimal list-inside space-y-2">
                <li>Los espacios de las zonas húmedas y las piscinas son de acceso y uso múltiple mixto para el uso de los propietarios y/o residentes, por esta razón y por la sana convivencia, es obligatorio el uso de la vestimenta adecuada: pantaloneta o vestido de baño.</li>
                <li>Todos los menores de 12 años deben estar acompañados por un adulto responsable.</li>
                <li>Deberán usar Toalla para su uso personal y deben secarse al salir de estas y no mojar las demás áreas comunes tales como ascensores, pasillos y hall de entrada a cada torre.</li>
                <li>El uso de las Zonas Húmedas y Piscinas es exclusivo para actividades pasivas de bienestar, que no generen ruidos ni perturben la tranquilidad de los demás usuarios.</li>
                <li>El uso de los Jacuzzi se asignará con previa solicitud a la administración o a la persona asignada por este, con una (1) hora de antelación por parte de cualquier propietario y/o residente pero no podrán utilizarse por más de (1) hora consecutiva.</li>
                <li>Los objetos personales se encuentran bajo la responsabilidad de sus propietarios.</li>
                <li>Tener especial cuidado en la manipulación de los muebles, cojinería y demás elementos.</li>
                <li>Hacer caso en todo momento de las indicaciones del personal de administración.</li>
                <li>Los objetos de las zonas húmedas y Piscina deben permanecer en el espacio y no se permite bajo ninguna circunstancia sacarlos del mismo.</li>
                <li>No se permite clavar en las piscinas.</li>
                <li>No se permite correr y saltar en las zonas húmedas y piscinas.</li>
                <li>No se permite el consumo de alimentos y/o medicamentos.</li>
                <li>No se permite fumar, el consumo de bebidas embriagantes y sustancias alucinógenas.</li>
                <li>No se permite el uso de envases de vidrio en las Zonas Húmedas.</li>
                <li>No se permite colocar música.</li>
                <li>No se permite hacer uso de las Zonas Húmedas y piscinas en compañía de animales domésticos.</li>
                <li>Los visitantes durante su permanencia deberán estar acompañados en todo momento por el propietario y/o residente que lo invitó.</li>
                <li>Se deberán reacomodar los elementos y mobiliario utilizados.</li>
                <li>El espacio debe quedar limpio y en las mismas condiciones en las que lo recibió bajo las indicaciones técnicas del personal de administración.</li>
                <li>Está totalmente prohibido el uso de Bronceadores en el jacuzzi y en la Piscina, estos cambian el PH del agua y causan sobrecostos de mantenimiento.</li>
            </ol>
            <p className="font-bold text-white">Manual Administrativo 4.1.10 Zonas Húmedas Y piscinas.</p>
          </div>
        )}

        {isBbqArea && (
          <div className="space-y-4 mt-4 pt-4 border-t border-white/10">
            <p className="font-semibold text-white">Horario de uso: 10:00 a.m. a 10:00 p.m.</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Las salas de la zona de BBQ son de acceso y uso múltiple mixto para el uso de los propietarios y/o residentes permanentes, por esta razón y por la sana convivencia, es obligatorio el uso de la vestimenta adecuada.</li>
              <li>El uso de la Zona de BBQ es exclusivo para actividades pasivas, que no generen ruidos ni que perturben la tranquilidad de los demás propietarios y/o residentes y vecinos.</li>
              <li>Todos los menores de edad deben estar acompañados por un adulto responsable.</li>
              <li>Tener especial cuidado en la manipulación de los equipos y accesorios.</li>
              <li>Las Salas de BBQ 1 y 2 se asignarán con previa solicitud a la administración o a la persona asignada por esta, con (5) días de antelación por parte de cualquier propietario y/o residente, pero no podrán utilizarse por más de (3) horas consecutivas, a menos que no se esté demandado su uso por otro propietario y/o residente.</li>
              <li>Los objetos personales se encuentran bajo responsabilidad de sus propietarios.</li>
              <li>Seguir en todo momento las indicaciones del personal de Administración.</li>
              <li>No se permite el consumo de medicamentos.</li>
              <li>No se permite fumar y el consumo de sustancias alucinógenas.</li>
              <li>Los asadores y accesorios de las salas de BBQ deben permanecer en el espacio y no se permite bajo ninguna circunstancia sacarlos del mismo.</li>
              <li>El uso de la música está permitido de acuerdo a la actividad que se realiza, a un volumen moderado que no perturbe la tranquilidad de los demás propietarios y/o residentes y vecinos.</li>
              <li>Reacomode los objetos, equipos y mobiliario utilizados antes de salir.</li>
              <li>El espacio debe quedar limpio y en las mismas condiciones en las que lo recibió bajo las indicaciones técnicas del personal de Administración.</li>
            </ol>
            <p className="font-bold text-white">Manual de convivencia 4.1.11 Zona de BBQ.</p>
          </div>
        )}

        {isCoworkingArea && (
          <div className="space-y-4 mt-4 pt-4 border-t border-white/10">
            <p className="font-semibold text-white">Horario de uso: 8:00 a.m. a 8:00 p.m.</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Los espacios del business Center como son los puestos de trabajo, las salas de reuniones 1 y 2, las salas y puestos de trabajo exteriores, el punto de café, etc. son de acceso múltiple mixto para el uso exclusivo de los propietarios y/o residentes permanentes, por esta razón y por la sana convivencia es obligatorio el uso de vestimenta y calzado adecuado.</li>
              <li>El uso de business center es exclusivo para actividades pasivas, que no generen ruidos ni que perturben la tranquilidad de los demás usuarios.</li>
              <li>Las salas de reuniones 1 y 2 se asignarán previa solicitud a la administración o a la persona asignada por esta, con (5) días de antelación por parte de cualquier propietario y/o residente y estos podrán hacer uso de estas con invitados con un número igual o inferior a la capacidad de la sala asignada, pero en ningún caso podrán utilizarse por más de una (1) hora consecutiva.</li>
              <li>El ingreso es exclusivamente para personas mayores de edad.</li>
              <li>Los objetos personales se encuentran bajo responsabilidad de sus propietarios.</li>
              <li>Tener especial cuidado en la manipulación de las cortinas, muebles, cojinería, tapetes y elementos de decoración.</li>
              <li>Seguir en todo momento las indicaciones del personal de la administración.</li>
              <li>Los objetos del business center deben permanecer dentro del mismo espacio y no se permite bajo ninguna circunstancia el retiro de estos.</li>
              <li>No se permite el consumo de alimentos.</li>
              <li>No se permite fumar, el uso de bebidas embriagantes y sustancias alucinógenas.</li>
              <li>Únicamente está permitido el consumo de bebidas hidratantes en termos, botellas o envases adecuados.</li>
              <li>No se permite colocar música.</li>
              <li>No se permite el ingreso de mascotas.</li>
              <li>Los visitantes durante su permanencia deberán estar acompañados en todo momento por el propietario y/o residente que los invitó.</li>
              <li>Los visitante únicamente podrán permanecer en las sala de reuniones 1 y 2 durante el tiempo que le fue asignado al propietario y/o residente por la administración, una vez cumplido el tiempo deberán retirarse de todas las áreas interiores y exteriores del Business Center.</li>
              <li>Se deberán reacomodar los elementos utilizados.</li>
              <li>El espacio debe quedar limpio y en las mismas condiciones en las que lo recibió bajo las indicaciones técnicas del personal de administración.</li>
            </ol>
            <p className="font-bold text-white">Manual de convivencia 4.3.1 Business Center.</p>
          </div>
        )}

        {isSocialHall && (
           <div className="space-y-4 mt-4 pt-4 border-t border-white/10">
             <p className="font-semibold text-white">Horario de uso: 10:00 a.m. a 10:00 p.m.</p>
             <ol className="list-decimal list-inside space-y-2">
              <li>Los espacios del salón de eventos son de acceso y uso múltiple mixto para el uso de los propietarios y/o residentes permanentes, por esta razón y por la sana convivencia es obligatorio el uso de la vestimenta adecuada.</li>
              <li>Las reuniones de Asamblea de co-propietarios se realizarán en el salón de eventos.</li>
              <li>Los espacios del salón de eventos son para uso exclusivo de los propietarios y/o residentes permanentes.</li>
              <li>El uso del salón de eventos es exclusivo para actividades lúdicas, familiares que no generen ruido, ni que perturben la tranquilidad de los demás propietarios y/o residentes.</li>
              <li>El uso del Salón de Eventos se asignará con previa solicitud a la administración o a la persona asignada por esta, con (5) días de antelación por parte de cualquier propietario y/o residente, pero no podrán utilizarse por más de (5) horas consecutivas, a menos que no se esté demandado por otro propietario y/o residente.</li>
              <li>Tener especial cuidado en la manipulación de los muebles y elementos de decoración.</li>
              <li>Los objetos personales se encuentran bajo la responsabilidad de sus propietarios.</li>
              <li>Seguir en todo momento las indicaciones del personal de la administración.</li>
              <li>Los objetos del salón de eventos deben permanecer en el espacio y no se permite bajo ninguna circunstancia sacarlos del mismo.</li>
              <li>El uso de la música está permitido de acuerdo con la actividad que se realiza, a un volumen moderado que no perturbe la tranquilidad de los demás propietarios y/o residente y vecinos.</li>
              <li>No se permite el uso de medicamentos.</li>
              <li>No se permite fumar y el consumo de sustancias alucinógenas.</li>
              <li>No se permite el ingreso de Mascotas.</li>
              <li>Los visitantes durante su permanencia deberán estar acompañados en todo momento por el propietario y/o residente que lo invitó.</li>
              <li>El espacio debe quedar limpio y en las mismas condiciones en las que lo recibió bajo las indicaciones técnicas del personal de administración.</li>
             </ol>
             <p className="font-bold text-white">Manual de Convivencia 4.1.9 Salon de Eventos</p>
           </div>
        )}

        <p className="font-semibold text-white mt-6">Al hacer clic en "Aceptar y continuar", usted confirma que ha leído, entendido y está de acuerdo con todos los términos y condiciones aquí establecidos.</p>
      </div>
      <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
        <Button
          onClick={onCancel}
          variant="outline"
          className="w-full sm:w-auto bg-transparent border-red-500 text-red-400 hover:bg-red-500/20 hover:text-red-300"
        >
          <XCircle className="w-5 h-5 mr-2" />
          Cancelar
        </Button>
        <Button
          onClick={onAccept}
          disabled={!isScrolledToEnd}
          className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Aceptar y continuar
        </Button>
      </div>
      {!isScrolledToEnd && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-blue-300 mt-4"
          >
            Por favor, desplácese hasta el final para aceptar los términos.
          </motion.p>
        )}
    </motion.div>
  );
};

export default TermsOfUse;