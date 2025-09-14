'use client';

import { useState } from 'react';

export default function DeviceLimitModal({ isOpen, onClose, devices, onForceLogout }) {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleForceLogout = async () => {
    if (!selectedDevice) return;
    setIsLoggingOut(true);
    await onForceLogout(selectedDevice);
    setIsLoggingOut(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-800">Device Limit Reached</h2>
        <p className="mt-2 text-gray-600">
          You have reached the maximum of {devices.length} logged-in devices. To continue, please log out from one of the following devices.
        </p>
        <div className="mt-4 max-h-60 overflow-y-auto rounded-md border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {devices.map((device) => (
              <li key={device.session_id} className="p-3">
                <label className="flex cursor-pointer items-center">
                  <input
                    type="radio"
                    name="device"
                    value={device.session_id}
                    onChange={() => setSelectedDevice(device)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <p className="font-semibold text-gray-700">{device.device_info || 'Unknown Device'}</p>
                    <p className="text-sm text-gray-500">
                      IP: {device.ip_address} | Logged in: {new Date(device.logged_in_at).toLocaleString()}
                    </p>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/auth/logout" className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            Cancel Login
          </a>
          <button
            onClick={handleForceLogout}
            disabled={!selectedDevice || isLoggingOut}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isLoggingOut ? 'Logging out...' : 'Force Log Out Selected Device'}
          </button>
        </div>
      </div>
    </div>
  );
}

