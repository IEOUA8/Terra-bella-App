import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CopyrightModal = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white/10 backdrop-blur-lg border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            Propiedad Intelectual y Creativa
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Toda la propiedad intelectual y creativa está a cargo de Jorge Enrique Gonzalez Arias, y cualquier copia, modificación, o adición será de su propiedad hasta que en otra forma se estipule lo contrario.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 text-gray-200 text-sm">
          <p>
            Este software y su diseño, incluyendo pero no limitado a la interfaz de usuario, la experiencia de usuario, la lógica de programación, los elementos gráficos y la estructura de la base de datos, son propiedad exclusiva de Jorge Enrique Gonzalez Arias.
          </p>
          <p>
            Queda estrictamente prohibida la reproducción, distribución, modificación, adaptación, transmisión, exhibición pública o cualquier otra forma de explotación de este software o de cualquiera de sus partes, sin la autorización expresa y por escrito del titular de los derechos de autor.
          </p>
          <p>
            Cualquier uso no autorizado de este software o de sus componentes constituirá una violación de los derechos de propiedad intelectual y será perseguido conforme a la legislación vigente.
          </p>
          <p>
            Para consultas sobre licencias o colaboraciones, por favor, contacte directamente con el titular.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CopyrightModal;