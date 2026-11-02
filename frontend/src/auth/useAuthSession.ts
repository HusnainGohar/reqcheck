import * as React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { clearApiCache, useApi } from '../api/client';
import { getIdentity, setIdentity } from '../api/http';
import { Session } from '../types/domain';

export function useAuthSession() {
  const history = ReactRouterDOM.useHistory();
  const { request } = useApi();
  const [session, setSession] = React.useState<Session | null>(null);
  const [checking, setChecking] = React.useState(true);
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const identityGeneration = React.useRef(0);
  const identityChanging = React.useRef(false);

  async function checkSession() {
    if (identityChanging.current) return;
    const generation = identityGeneration.current;
    try {
      const result = await request<Session>('/auth/session');
      if (generation !== identityGeneration.current) return;
      if (getIdentity() !== (result.csrf_token || '')) clearApiCache();
      setIdentity(result.csrf_token || '');
      setSession(result.authenticated ? result : null);
      setError('');
    } catch (err) {
      if (generation !== identityGeneration.current) return;
      setError(err instanceof Error ? err.message : 'Could not check your session.');
    } finally { setChecking(false); }
  }

  React.useEffect(function() {
    checkSession();
    function expired() {
      identityGeneration.current += 1;
      clearApiCache(); setIdentity('');
      setSession(null);
      setError('Your session ended. Account work remains saved. Guest work cannot be resumed after expiry.');
      history.replace('/login');
    }
    window.addEventListener('reqcheck-session-ended', expired);
    const interval = window.setInterval(checkSession, 60000);
    return function() {
      window.removeEventListener('reqcheck-session-ended', expired);
      window.clearInterval(interval);
    };
  }, []);

  async function authenticate(kind: 'guest' | 'register' | 'login', payload: object) {
    identityGeneration.current += 1;
    identityChanging.current = true;
    setBusy(true); setError('');
    try {
      const result = await request<Session>('/auth/' + kind, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const destination = new URLSearchParams(history.location.search).get('next');
      clearApiCache(); setIdentity(result.csrf_token || '');
      setSession(result);
      history.replace(destination && ['/workspace', '/account/password', '/end-guest'].indexOf(destination) !== -1
        ? destination : '/workspace');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start your session.');
    } finally { identityChanging.current = false; setBusy(false); }
  }

  async function logout() {
    if (session && session.kind === 'guest' && history.location.pathname !== '/end-guest') {
      history.push('/end-guest');
      return;
    }
    identityGeneration.current += 1;
    identityChanging.current = true;
    setBusy(true); setError('');
    try {
      await request('/auth/logout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      });
      if (session && session.kind === 'guest') {
        sessionStorage.removeItem('reqcheck.' + session.owner_id + '.project');
        sessionStorage.removeItem('reqcheck.' + session.owner_id + '.document');
      }
      clearApiCache(); setIdentity(''); setSession(null);
      history.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session could not be ended. Please retry.');
    } finally { identityChanging.current = false; setBusy(false); }
  }

  return { session, checking, error, busy, checkSession, authenticate, logout };
}
