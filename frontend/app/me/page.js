'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { UAParser } from 'ua-parser-js';
import { useEffect, useState, useCallback } from 'react';
import DeviceLimitModal from '../components/DeviceLimitModal';

export default function ProfilePage() {
    const { user, error, isLoading } = useUser();
    const namespace = 'https://my-secure-app.dev/';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);

    const fetchSessions = useCallback(async () => {
        if (!user) return;
        setSessionsLoading(true);
        try {
            const tokenResponse = await fetch('/api/token');
            const { accessToken } = await tokenResponse.json();

            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
            const sessionsResponse = await fetch(`${apiBaseUrl}/api/sessions`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!sessionsResponse.ok) throw new Error("Failed to fetch sessions");
            const data = await sessionsResponse.json();
            setSessions(data);
        } catch (e) {
            console.error("Failed to fetch sessions", e);
        } finally {
            setSessionsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchSessions();
            if (user.deviceLimitReached) {
                setSessions(user.activeDevices || []);
                setIsModalOpen(true);
            }
        }
    }, [user, fetchSessions]);

    useEffect(() => {
        if (!isLoading && !user) window.location.href = '/api/auth/login?returnTo=/me';
    }, [isLoading, user]);

    // --- FINAL IMPLEMENTATION OF handleForceLogout ---
    const handleForceLogout = async (deviceToLogout) => {
        try {
            // Step 1: Terminate the selected session
            const tokenResponse = await fetch('/api/token');
            const { accessToken } = await tokenResponse.json();

            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
            const deleteResponse = await fetch(`${apiBaseUrl}/api/session/${deviceToLogout.session_id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!deleteResponse.ok) throw new Error("Failed to terminate session");

            const ua = new UAParser(window.navigator.userAgent);
            const { browser, os } = ua.getResult();
            const deviceInfo = `${browser.name} ${browser.version || ''} on ${os.name} ${os.version || ''}`.trim();

            const registerResponse = await fetch(`${apiBaseUrl}/api/session/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify({ session_id: user.sid, device_info: deviceInfo }),
            });

            const data = await registerResponse.json();

            if (data.status === 'success') {
                
                alert(`Successfully logged out ${deviceToLogout.device_info}. This device is now logged in.`);
                setIsModalOpen(false);
                fetchSessions();
            } else {
        
                throw new Error(data.message || "Failed to register new session.");
            }
        } catch (e) {
            console.error("Failed to force logout and re-register", e);
            alert(`Error: ${e.message}`);
        }
    };

    const handleLogoutClick = async () => {
        setIsLoggingOut(true);
        try {
            const tokenResponse = await fetch('/api/token');
            const { accessToken } = await tokenResponse.json();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
            await fetch(`${apiBaseUrl}/api/session/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify({ session_id: user.sid }),
            });
        } catch (e) {
            console.error("Failed to clear backend session.", e);
        } finally {
            window.location.href = '/api/auth/logout';
        }
    };

    if (isLoading || (!user && !error)) {
        return <div className="flex min-h-[50vh] items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div></div>;
    }
    if (error) return <div className="p-8 text-center text-red-500">{error.message}</div>;

    return (
        user && (
            <>
                <DeviceLimitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} devices={sessions} onForceLogout={handleForceLogout} />
                <div className="py-12">
                    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 space-y-8">
                        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
                            <div className="p-8 text-center">
                                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                                    <svg  xmlns="http://www.w3.org/2000/svg" width="50px" height="50px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                </div>
                                <h1 className="mt-4 text-2xl font-bold text-gray-900">{user.name}</h1>
                                <p className="mt-1 text-gray-600">{user.email}</p>
                            </div>
                            <div className="border-t border-gray-200 bg-gray-50 px-8 py-6">
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Contact Information</h3>
                                <dl className="mt-4"><dt className="text-sm font-medium text-gray-500">Phone Number</dt><dd className="mt-1 text-sm text-gray-900">{user[`${namespace}phone_number`] || 'Not provided'}</dd></dl>
                            </div>
                            <div className="border-t border-gray-200 p-6 text-center">
                                <button
                                    onClick={handleLogoutClick}
                                    disabled={isLoggingOut}
                                    className="inline-block cursor-pointer rounded-md bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-105 hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                                >
                                    {isLoggingOut ? 'Logging out...' : 'Log Out This Device'}
                                </button>

                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-white shadow-lg">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Active Sessions</h3>
                                <p className="mt-1 text-sm text-gray-600">You can login with atmost 2 device at a time with this account.</p>
                            </div>
                            <ul className="divide-y divide-gray-200">
                                {sessionsLoading ? (
                                    <li className="p-4 text-center text-gray-500">Loading sessions...</li>
                                ) : (
                                    sessions.map(session => (
                                        <li key={session.session_id} className="p-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-gray-800">{session.device_info} {session.session_id === user.sid && <span className="text-xs font-medium text-green-700 bg-green-100 rounded-full px-2 py-0.5 ml-2">This device</span>}</p>
                                                <p className="text-sm text-gray-500">IP: {session.ip_address} &middot; Logged in: {new Date(session.logged_in_at).toLocaleDateString()}</p>
                                            </div>
                                            {session.session_id !== user.sid && (
                                                <button onClick={() => handleForceLogout(session)} className="text-sm cursor-pointer font-semibold text-red-600 hover:text-red-800">
                                                    Terminate
                                                </button>
                                            )}
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </>
        )
    );
}

