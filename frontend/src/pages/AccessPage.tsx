import * as React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from "../auth/AuthContext";
import { Icon } from "../components/ui/Icon";
import { PasswordField } from "../components/ui/PasswordField";

export function AccessPage(props: { kind: 'guest' | 'register' | 'login' }) {
  const { busy, authenticate } = useAuth();
  const route = props.kind;
  const location = ReactRouterDOM.useLocation();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [validation, setValidation] = React.useState('');
  const errorSummary = React.useRef<HTMLParagraphElement>(null);
  React.useEffect(function() { if (validation) errorSummary.current?.focus(); }, [validation]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (route === 'register' && password !== confirmPassword) {
      setValidation('Passwords do not match.'); errorSummary.current?.focus(); return;
    }
    setValidation('');
    await authenticate(route, route === 'guest' ? { acknowledge_temporary: acknowledged } :
      route === 'register' ? { name, email, password, confirm_password: confirmPassword } : { email, password });
  }
  return <main className="access-shell access-split">
    <aside className="access-story" aria-label="Review workspace benefits">
      <p className="eyebrow">Less ambiguity. More clarity.</p>
      <h2>A little structure.<br />A better specification.</h2>
      <p>Turn documents into decisions you can explain. One requirement at a time.</p>
      <div className="story-evidence"><Icon name="document" size={28} /><span>SOURCE DOCUMENT</span><div className="story-lines" aria-hidden="true"><span /><span /><span /></div><div className="story-check"><Icon name="check" size={18} />Review with context</div></div>
      <ul><li><Icon name="edit" />Refine the original text</li><li><Icon name="chart" />Explore explainable suggestions</li><li><Icon name="download" />Take your evidence with you</li></ul>
      <p className="story-footnote">{route === 'guest' ? 'A temporary space to try the full workflow.' : 'Your saved workspace, ready when you are.'}</p>
    </aside>
    <section className="access-card" aria-labelledby="access-title">
      <p className="eyebrow">{route === 'guest' ? 'Explore without an account' : route === 'register' ? 'Your personal workspace' : 'Good to have you back'}</p>
      <div className="access-icon"><Icon name={route === 'guest' ? 'clock' : 'shield'} size={30} /></div>
      <h1 id="access-title">{route === 'guest' ? 'Try a temporary workspace' : route === 'register' ? 'Create your account' : 'Welcome to ReqCheck'}</h1>
      <p>{route === 'guest' ? 'No account required. Review documents, run analysis and download reports during your active session.' : 'Your documents, edits, reviewer decisions and results are saved to your account. Log in again to resume your work.'}</p>
      {validation ? <p ref={errorSummary} tabIndex={-1} className="notice error" role="alert">{validation} <a href="#account-confirm-password" onClick={function(event) { event.preventDefault(); document.getElementById('account-confirm-password')?.focus(); }}>Check confirmation</a></p> : null}
      <form onSubmit={submit}>
        {route === 'guest' ? <>
          <div className="notice warning">Guest work is not saved for later retrieval. It is deleted when you explicitly end the session or within 24 hours of starting. Closing a browser does not reliably notify the server; abandoned data is removed after expiry. Browser session restoration may keep an active session until it expires.</div>
          <label className="guest-acknowledgement"><input type="checkbox" required checked={acknowledged} onChange={function(event) { setAcknowledged(event.target.checked); }} />I understand my work is temporary and will not be available after this session ends.</label>
        </> : <>
            {route === 'register' ? <>
              <label className="field-label" htmlFor="account-name">Name</label>
              <input id="account-name" className="text-input" required maxLength={120} autoComplete="name" disabled={busy} value={name} onChange={function(event) { setName(event.target.value); }} />
            </> : null}
            <label className="field-label" htmlFor="account-email">Email address</label>
            <input id="account-email" className="text-input" type="email" required maxLength={254} autoComplete="email" disabled={busy} value={email} onChange={function(event) { setEmail(event.target.value); }} />
            <label className="field-label" htmlFor="account-password">Password</label>
            <PasswordField id="account-password" label="Password" autoComplete={route === 'register' ? 'new-password' : 'current-password'} value={password} disabled={busy} onChange={setPassword} describedBy="account-password-help" />
            {route === 'register' ? <>
              <label className="field-label" htmlFor="account-confirm-password">Confirm password</label>
              <PasswordField id="account-confirm-password" label="Confirm password" autoComplete="new-password" value={confirmPassword} disabled={busy}
                onChange={function(value) { setConfirmPassword(value); if (validation) setValidation(''); }} invalid={Boolean(validation)} describedBy={validation ? 'confirm-password-error' : undefined} />
              {validation ? <p className="field-error" id="confirm-password-error">Enter the same password in both fields.</p> : null}
            </> : null}
            <p className="access-help" id="account-password-help">Use 12–128 characters. Login uses a browser-session cookie and expires after 24 hours; saved account work remains available.</p>
          </>}
        <button type="submit" className="primary-button" disabled={busy || route === 'guest' && !acknowledged}>
          {busy ? <span className="spinner" /> : <Icon name="arrow" />}{busy ? 'Please wait…' : route === 'guest' ? 'Continue as Guest' : route === 'register' ? 'Create account & start' : 'Log in & start reviewing'}
        </button>
      </form>
      <div className="access-links">
        {route !== 'guest' ? <ReactRouterDOM.Link to={'/guest' + location.search}>Continue as Guest</ReactRouterDOM.Link> : <ReactRouterDOM.Link to={'/register' + location.search}>Create an account to keep your work</ReactRouterDOM.Link>}
        {route === 'register' ? <ReactRouterDOM.Link to={'/login' + location.search}>Already have an account? Log in</ReactRouterDOM.Link> : route === 'login' ? <ReactRouterDOM.Link to={'/register' + location.search}>Create account</ReactRouterDOM.Link> : null}
        <ReactRouterDOM.Link to="/">Back to start</ReactRouterDOM.Link>
      </div>
    </section>
  </main>;
}
