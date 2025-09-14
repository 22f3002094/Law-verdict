import { handleAuth, handleCallback, handleLogin } from '@auth0/nextjs-auth0';
import { UAParser } from 'ua-parser-js';


const afterCallback = async (req, session) => {
  const { accessToken, user } = session;

  if (accessToken && user) {
    const headers = new Headers(req.headers);
    const ua = new UAParser(headers.get('user-agent'));
    const { browser, os } = ua.getResult();
    const deviceInfo = `${browser.name} ${browser.version || ''} on ${os.name} ${os.version || ''}`.trim();
    const sessionId = user.sid; 

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/api/session/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ session_id: sessionId, device_info: deviceInfo }),
      });
      const data = await response.json();

      if (data.status === 'limit_reached') {
        session.user.deviceLimitReached = true;
        session.user.activeDevices = data.active_devices;
      }
    } catch (error) {
      console.error('Failed to register session:', error);
    }
  }
  return session;
};


export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: { audience: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE },
    returnTo: "/me",
  }),
  callback: handleCallback({ afterCallback }),

});

