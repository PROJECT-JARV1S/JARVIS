# Frontend Telemetry Integration Guide

This guide details the steps required to integrate the new backend-driven telemetry system into the frontend components.

---

## Step 1: Create the System Service

Create the service file at `src/services/system.service.ts` to expose the initial fetch command and the Tauri event-listener.

```typescript
// E:\Documents\code\git\JARVIS\src\services\system.service.ts
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export interface SystemInfo {
  time: string;
  cpu_temperature: number | null;
  username: string;
  cpu_usage: number;
  ram_usage: number;
  disk_usage: number;
}

/**
 * Fetches the initial system telemetry cached on the backend.
 * Crucial to prevent layout shifting/loading stubs on component mount.
 */
pub async function getSystemInfo(): Promise<SystemInfo> {
  return await invoke<SystemInfo>('get_system_info');
}

/**
 * Subscribes to live system telemetry updates emitted by the backend worker.
 * @param callback Called every 3 seconds with fresh system telemetry.
 */
pub async function onTelemetryReceived(
  callback: (info: SystemInfo) => void
): Promise<UnlistenFn> {
  return await listen<SystemInfo>('system-telemetry', (event) => {
    callback(event.payload);
  });
}
```

---

## Step 2: Create the `useSystemInfo` React Hook

Create a simple hook at `src/hooks/useSystemInfo.ts` for titlebars or lightweight components that only need the current values.

```typescript
// E:\Documents\code\git\JARVIS\src\hooks\useSystemInfo.ts
import { useEffect, useState } from 'react';
import { getSystemInfo, onTelemetryReceived, SystemInfo } from '@/services/system.service';

export const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    // Fetch initial cached state immediately
    getSystemInfo().then(setSystemInfo).catch(console.error);

    // Subscribe to live events
    let unlisten: (() => void) | undefined;
    const setupListener = async () => {
      try {
        unlisten = await onTelemetryReceived((info) => {
          setSystemInfo(info);
        });
      } catch (err) {
        console.error('Failed to subscribe to telemetry:', err);
      }
    };
    setupListener();

    // Clean up subscription on unmount
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  return systemInfo;
};
```

---

## Step 3: Update `Titlebar.tsx`

Update `src/components/navigation/Titlebar.tsx` to read the actual system disk usage and username.

```diff
// E:\Documents\code\git\JARVIS\src\components\navigation\Titlebar.tsx
-import { MOCK_SYSTEM_UTILITIES } from '@/lib/mockData';
+import { useSystemInfo } from '@/hooks/useSystemInfo';

 export const Titlebar = () => {
   const { isListening, transcript, startListening, stopListening } = useVoice();
   const [searchTerm, setSearchTerm] = useState('');
   const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
+  const systemInfo = useSystemInfo();

   // ... keep local clock logic for secondary-based updating ...

   return (
       {/* CENTER: System Display & Neural Pulse */}
       <div className="flex items-center gap-8">
         <div className="flex items-center gap-4">
-          <div className="text-tertiary-txt text-[11px] font-mono uppercase tracking-tight pointer-events-none">
-            BATTERY: <span className="text-success-green font-bold">{MOCK_SYSTEM_UTILITIES.batteryData}%</span>
-          </div>
+          <div className="text-tertiary-txt text-[11px] font-mono uppercase tracking-tight pointer-events-none">
+            DISK: <span className="text-success-green font-bold">{systemInfo ? Math.round(systemInfo.disk_usage) : '--'}%</span>
+          </div>
           <div className="text-primary-txt text-[11px] font-mono uppercase tracking-tight pointer-events-none border-l border-white/10 pl-4 min-w-[100px]">
             <span className="text-tertiary-txt">TIME: </span>{currentTime}
           </div>
         </div>
       </div>

       {/* RIGHT: Search & User */}
       <div className="flex items-center gap-4">
         {/* User Profile */}
         <div className="flex items-center gap-3 pl-2 border-l border-white/10">
            <div className="rounded-full bg-jarvis-blue/10 border border-jarvis-blue/30 w-8 h-8 flex items-center justify-center text-xs font-mono text-jarvis-blue shadow-[0_0_10px_rgba(0,240,255,0.1)] hover:bg-jarvis-blue hover:text-base transition-all duration-300 cursor-pointer">
-            S
+            {systemInfo ? systemInfo.username.substring(0, 2).toUpperCase() : 'U'}
           </div>
         </div>
       </div>
   );
 };
```

---

## Step 4: Update `OfflineTitlebar.tsx`

Update `src/components/navigation/OfflineTitlebar.tsx` to pull real telemetry data.

```diff
// E:\Documents\code\git\JARVIS\src\components\navigation\OfflineTitlebar.tsx
-import { MOCK_SYSTEM_UTILITIES } from '@/lib/mockData';
+import { useSystemInfo } from '@/hooks/useSystemInfo';

 export const OfflineTitlebar = () => {
+  const systemInfo = useSystemInfo();
+  const formattedTime = systemInfo 
+    ? new Date(systemInfo.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
+    : '--:--';

   return (
       {/* Center-Right: Telemetry */}
       <div className="flex items-center gap-8 z-10">
         <div className="flex items-center gap-6 border-r border-white/5 pr-6">
           <div className="flex items-center gap-2.5 group">
             <HardDrive size={14} className="text-offline-core/60 group-hover:text-offline-core transition-colors" />
             <div className="text-xs font-mono text-secondary-txt uppercase">
-              Disk <span className="text-primary-txt ml-1 font-bold">84%</span>
+              Disk <span className="text-primary-txt ml-1 font-bold">{systemInfo ? Math.round(systemInfo.disk_usage) : '--'}%</span>
             </div>
           </div>

           <div className="flex items-center gap-2.5 group">
             <Cpu size={14} className="text-offline-core/60 group-hover:text-offline-core transition-colors" />
             <div className="text-xs font-mono text-secondary-txt uppercase">
-              Temp <span className="text-primary-txt ml-1 font-bold">24.2°C</span>
+              Temp <span className="text-primary-txt ml-1 font-bold">{systemInfo?.cpu_temperature ? `${systemInfo.cpu_temperature.toFixed(1)}°C` : 'N/A'}</span>
             </div>
           </div>
         </div>

         <div className="text-xs font-mono text-primary-txt uppercase tracking-tight border-l border-white/5 pl-6">
           <span className="text-secondary-txt opacity-50 mr-2">TIME:</span>
-          {MOCK_SYSTEM_UTILITIES.timeData}
+          {formattedTime}
         </div>
       </div>

       {/* Profile Avatar */}
       <div className="w-9 h-9 bg-offline-surface border border-offline-border flex items-center justify-center text-xs font-mono text-offline-core hover:bg-offline-core hover:text-offline-bg transition-all duration-300 cursor-pointer shadow-inner font-bold">
-        S
+        {systemInfo ? systemInfo.username.substring(0, 1).toUpperCase() : 'U'}
       </div>
   );
 };
```

---

## Step 5: Update `useSystemData.tsx` (Dashboard Feed)

Update the hook at `src/hooks/useSystemData.tsx` to subscribe to system events, so the CPU, RAM, and Disk metrics on the main dashboard charts are real.

```typescript
// E:\Documents\code\git\JARVIS\src\hooks\useSystemData.tsx
import { useState, useEffect, useCallback } from 'react';
import { onTelemetryReceived, SystemInfo } from '@/services/system.service';
import { 
  MOCK_SYSTEM_STATS, MOCK_DEVICES, MOCK_TASKS, 
  MOCK_EVENTS, MOCK_CPU_HISTORY, MOCK_RAM_HISTORY, MOCK_NET_HISTORY 
} from '@/lib/mockData';

export const useSystemData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState(MOCK_SYSTEM_STATS);
  const [devices, setDevices] = useState(MOCK_DEVICES);
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [history, setHistory] = useState({
    cpu: MOCK_CPU_HISTORY, ram: MOCK_RAM_HISTORY, net: MOCK_NET_HISTORY
  });

  // Keep existing toggleTask, rebootDevice, addDevice methods...

  // Telemetry Subscriber
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        unlisten = await onTelemetryReceived((info) => {
          // 1. Update overall average statistics
          setStats((prev) => ({
            ...prev,
            avgCpuUsage: Math.round(info.cpu_usage),
            avgRamUsage: Math.round(info.ram_usage),
          }));

          // 2. Append to rolling chart histories
          setHistory((prev) => {
            const timeStr = new Date(info.time).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            });

            return {
              cpu: [...prev.cpu.slice(1), { time: timeStr, value: Math.round(info.cpu_usage) }],
              ram: [...prev.ram.slice(1), { time: timeStr, value: Math.round(info.ram_usage) }],
              net: prev.net, // net traffic remains simulated/mocked for now
            };
          });

          // 3. Mark loading complete on first telemetry packet
          setIsLoading(false);
        });
      } catch (err) {
        console.error('Telemetry subscription error:', err);
        setError('Failed to establish backend telemetry uplink');
        setIsLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  return { stats, devices, tasks, events, history, isLoading, error, toggleTask, rebootDevice, addDevice };
};
```
