import * as React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useApi } from "../api/client";
import { PrivatePage } from "../components/layout/PrivatePage";
import { PasswordField } from "../components/ui/PasswordField";

export function PasswordPage() {
  const { request } = useApi();
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const errorSummary = React.useRef<HTMLParagraphElement>(null);
  React.useEffect(function() { if (error) errorSummary.current?.focus(); }, [error]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setMessage('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); errorSummary.current?.focus(); return; }
    setBusy(true);
    try {
      const result = await request<{ message: string }>('/auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, password, confirm_password: confirmPassword }),
      });
      setMessage(result.message); setCurrentPassword(''); setPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password could not be changed. Please retry.');
    } finally { setBusy(false); }
  }
  return <PrivatePage busy={busy}><ReactRouterDOM.Prompt when={busy} message="Your password change is still being processed. Leave this page?" />
    <main className="access-shell"><section className="access-card"><h1>Change Password</h1>
      <p>Confirm your current password. Changing it signs out other sessions; this session stays active.</p>
      {error ? <p ref={errorSummary} tabIndex={-1} className="notice error" role="alert">{error}{error === 'Passwords do not match.' ? <> <a href="#confirm-new-password" onClick={function(event) { event.preventDefault(); document.getElementById('confirm-new-password')?.focus(); }}>Check confirmation</a></> : null}</p> : null}
      {message ? <p className="notice success" role="status">{message}</p> : null}
      <form onSubmit={submit}>
        <label className="field-label" htmlFor="current-password">Current password</label>
        <PasswordField id="current-password" label="Current password" autoComplete="current-password" value={currentPassword} disabled={busy} onChange={setCurrentPassword} />
        <label className="field-label" htmlFor="new-password">New password</label>
        <PasswordField id="new-password" label="New password" autoComplete="new-password" value={password} disabled={busy} onChange={setPassword} describedBy="new-password-help" />
        <label className="field-label" htmlFor="confirm-new-password">Confirm new password</label>
        <PasswordField id="confirm-new-password" label="Confirm new password" autoComplete="new-password" value={confirmPassword} disabled={busy}
          onChange={function(value) { setConfirmPassword(value); if (error === 'Passwords do not match.') setError(''); }}
          invalid={error === 'Passwords do not match.'} describedBy={error === 'Passwords do not match.' ? 'new-password-error' : undefined} />
        {error === 'Passwords do not match.' ? <p className="field-error" id="new-password-error">Enter the same password in both fields.</p> : null}
        <p className="access-help" id="new-password-help">Use a different password with 12–128 characters.</p>
        <button type="submit" className="primary-button" disabled={busy}>{busy ? 'Changing password…' : 'Save new password'}</button>
      </form>
      <ReactRouterDOM.Link className="secondary-button" to="/workspace">Back to workspace</ReactRouterDOM.Link>
    </section></main>
  </PrivatePage>;
}
