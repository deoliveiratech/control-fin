import { useEffect, useState } from 'react';
import './InstallButton.css'; // Arquivo CSS separado

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Verificar se está no modo standalone
  const isInStandaloneMode = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  useEffect(() => {
    if (isInStandaloneMode()) {
      setIsInstalled(true);
      setShowInstallButton(false);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallButton(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('App instalado');
    } else {
      console.log('Instalação recusada');
    }
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  if (isInstalled) {
    return <p className="installed-text">✅ App instalado</p>;
  }

  return (
    <>
      {showInstallButton && (
        <button className="install-button" onClick={handleInstallClick}>
          📲 Instalar App
        </button>
      )}
    </>
  );
}
