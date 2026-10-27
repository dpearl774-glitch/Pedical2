import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New PediCal version available.');
  },
  onOfflineReady() {
    console.log('PediCal is ready for offline clinical use.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
