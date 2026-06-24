import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Download, CheckCircle, AlertCircle, Share, PlusSquare } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';

const PWAStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swRegistered, setSwRegistered] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check Service Worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        setSwRegistered(!!registration);
      });
    }

    // Check if app is installed (PWA)
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || window.navigator.standalone 
        || document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (swRegistered && isInstalled) return 'bg-green-500';
    if (swRegistered) return 'bg-teal-600'; // Updated to Teal for better branding match
    return 'bg-gray-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Modo Sin Conexión';
    if (swRegistered && isInstalled) return 'PWA Instalada y Activa';
    if (swRegistered) return 'Service Worker Activo';
    return 'Modo Online';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (swRegistered && isInstalled) return <CheckCircle className="w-4 h-4" />;
    if (swRegistered) return <Download className="w-4 h-4" />;
    return <Wifi className="w-4 h-4" />;
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <HoverCard open={showTooltip} onOpenChange={setShowTooltip}>
        <HoverCardTrigger asChild>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="cursor-pointer"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Badge 
              className={`${getStatusColor()} text-white border-white/20 hover:${getStatusColor()} transition-all duration-300 flex items-center gap-2 px-3 py-2 shadow-lg`}
            >
              {getStatusIcon()}
            </Badge>
          </motion.div>
        </HoverCardTrigger>
        <HoverCardContent 
          className="w-72 bg-slate-800 border-slate-700 text-white"
          align="end"
        >
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                {getStatusIcon()}
                Estado de la Aplicación
              </h4>
              <p className="text-xs text-slate-300">{getStatusText()}</p>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Conexión:</span>
                <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
                  {isOnline ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Service Worker:</span>
                <Badge variant={swRegistered ? "default" : "secondary"} className="text-xs">
                  {swRegistered ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                  {swRegistered ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Instalación:</span>
                <Badge variant={isInstalled ? "default" : "secondary"} className="text-xs">
                  {isInstalled ? <CheckCircle className="w-3 h-3 mr-1" /> : <Download className="w-3 h-3 mr-1" />}
                  {isInstalled ? 'Instalada' : 'No Instalada'}
                </Badge>
              </div>
            </div>

            {!isInstalled && isIOS && (
              <div className="mt-3 p-3 bg-slate-700/50 rounded-md border border-slate-600">
                <p className="text-xs font-semibold text-teal-300 mb-2">
                  Instalar en iOS:
                </p>
                <ol className="text-xs text-slate-300 space-y-1 list-decimal pl-4">
                  <li className="flex items-center gap-1">
                    Pulsa el botón Compartir <Share className="w-3 h-3 inline" />
                  </li>
                  <li className="flex items-center gap-1">
                    Selecciona "Añadir a inicio" <PlusSquare className="w-3 h-3 inline" />
                  </li>
                </ol>
              </div>
            )}

            {!isOnline && (
              <div className="mt-3 p-2 bg-red-500/20 rounded border border-red-500/30">
                <p className="text-xs text-red-200">
                  Estás trabajando en modo offline. Los cambios se sincronizarán cuando vuelvas a estar online.
                </p>
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};

export default PWAStatus;