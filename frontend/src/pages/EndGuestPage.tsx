import * as React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from "../auth/AuthContext";
import { PrivatePage } from "../components/layout/PrivatePage";
import { Icon } from "../components/ui/Icon";

export function EndGuestPage() {
  const { session, busy, error, logout } = useAuth();
  if (session && session.kind !== 'guest') return <ReactRouterDOM.Redirect to="/workspace" />;
  return <PrivatePage>
    <main className="access-shell">
      <section className="access-card"><Icon name="trash" size={30} /><h1>End guest session?</h1><p>This permanently deletes this guest workspace, including uploads, requirements, reviews and analysis results. Download any reports you need first.</p>
        {error ? <p className="notice error" role="alert">{error}</p> : null}
        <div className="hero-actions"><button className="danger-button" type="button" disabled={busy} onClick={logout}>{busy ? 'Deleting temporary work…' : 'End session & delete work'}</button><ReactRouterDOM.Link className="secondary-button" to="/workspace">Back to workspace</ReactRouterDOM.Link></div>
      </section>
    </main>
  </PrivatePage>;
}
