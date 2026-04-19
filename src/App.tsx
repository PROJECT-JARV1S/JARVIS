import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MainLayout } from '@/layouts/MainLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { DeviceManagementPage } from '@/pages/DeviceManagementPage';
import { AutomationPage } from '@/pages/AutomationPage';
import { IntroBootSequence } from '@/components/ui/IntroBootSequence'; 
import './styles.css';

function App() {
  const [isBooted, setIsBooted] = useState(() => {
    return sessionStorage.getItem('jarvis_booted') === 'true';
  });

  return (
    <div className="bg-black min-h-screen w-full relative">
      {/* mode="sync" allows the Dashboard to be visible behind the exiting Video */}
      <AnimatePresence mode="sync">
        {!isBooted ? (
          <IntroBootSequence 
            key="intro-layer" 
            onComplete={() => {
               sessionStorage.setItem('jarvis_booted', 'true');
               setIsBooted(true);
            }} 
          />
        ) : null}

        {/* The Dashboard is always "available" but starts at 0 opacity if not booted */}
        {isBooted && (
          <motion.div
            key="dashboard-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full w-full"
          >
            <BrowserRouter>
              <Routes>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/device" element={<DeviceManagementPage />} />
                  <Route path='/automations' element={<AutomationPage/>} />
                </Route>
              </Routes>
            </BrowserRouter>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;