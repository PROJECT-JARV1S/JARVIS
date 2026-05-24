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

const isTauri = () => {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
};

let useSimulationMode = false;

export function isTelemetrySimulated(): boolean {
  return useSimulationMode;
}

/**
 * Fetches the initial system telemetry cached on the backend.
 * Crucial to prevent layout shifting/loading stubs on component mount.
 */
export async function getSystemInfo(): Promise<SystemInfo> {
  if (!isTauri() || useSimulationMode) {
    return getMockSystemInfo();
  }
  try {
    return await invoke<SystemInfo>('get_system_info');
  } catch (err) {
    console.warn('[SystemService] get_system_info invoke failed, switching to simulation mode:', err);
    useSimulationMode = true;
    return getMockSystemInfo();
  }
}

/**
 * Subscribes to live system telemetry updates emitted by the backend worker.
 * @param callback Called every 3 seconds with fresh system telemetry.
 */
export async function onTelemetryReceived(
  callback: (info: SystemInfo) => void
): Promise<UnlistenFn> {
  if (!isTauri() || useSimulationMode) {
    return setupMockTelemetryInterval(callback);
  }

  let receivedPacket = false;
  let unlistenFn: UnlistenFn | null = null;
  let mockUnlisten: UnlistenFn | null = null;

  const fallbackTimeout = setTimeout(() => {
    if (!receivedPacket) {
      console.info('[SystemService] No telemetry event received from backend in 1.5s, falling back to simulation.');
      useSimulationMode = true;
      mockUnlisten = setupMockTelemetryInterval(callback);
    }
  }, 1500);

  try {
    unlistenFn = await listen<SystemInfo>('system-telemetry', (event) => {
      receivedPacket = true;
      clearTimeout(fallbackTimeout);
      callback(event.payload);
    });

    return () => {
      clearTimeout(fallbackTimeout);
      if (unlistenFn) unlistenFn();
      if (mockUnlisten) mockUnlisten();
    };
  } catch (err) {
    console.warn('[SystemService] system-telemetry listener setup failed, using fallback:', err);
    clearTimeout(fallbackTimeout);
    return setupMockTelemetryInterval(callback);
  }
}

// ─── Fallback / Simulation Helpers ──────────────────────────────────────────

function getMockSystemInfo(): SystemInfo {
  return {
    time: new Date().toISOString(),
    cpu_temperature: 38.4,
    username: 'Seth',
    cpu_usage: 12,
    ram_usage: 44,
    disk_usage: 68,
  };
}

let mockListeners: Array<(info: SystemInfo) => void> = [];
let mockIntervalId: NodeJS.Timeout | null = null;
let lastMockInfo: SystemInfo = getMockSystemInfo();

function setupMockTelemetryInterval(callback: (info: SystemInfo) => void): UnlistenFn {
  mockListeners.push(callback);
  
  // Deliver the last computed state immediately so there is no 3-second lag on mount
  callback(lastMockInfo);

  if (!mockIntervalId) {
    let cpu = lastMockInfo.cpu_usage;
    let ram = lastMockInfo.ram_usage;
    let temp = lastMockInfo.cpu_temperature || 38;

    mockIntervalId = setInterval(() => {
      cpu = Math.min(100, Math.max(5, cpu + (Math.random() * 12 - 6)));
      ram = Math.min(100, Math.max(20, ram + (Math.random() * 6 - 3)));
      temp = Math.min(85, Math.max(30, temp + (Math.random() * 4 - 2)));

      lastMockInfo = {
        time: new Date().toISOString(),
        cpu_temperature: parseFloat(temp.toFixed(1)),
        username: 'Seth',
        cpu_usage: Math.round(cpu),
        ram_usage: Math.round(ram),
        disk_usage: 68,
      };

      // Broadcast changes to all subscribers
      mockListeners.forEach(listener => listener(lastMockInfo));
    }, 3000);
  }

  return () => {
    mockListeners = mockListeners.filter(listener => listener !== callback);
    if (mockListeners.length === 0 && mockIntervalId) {
      clearInterval(mockIntervalId);
      mockIntervalId = null;
    }
  };
}
