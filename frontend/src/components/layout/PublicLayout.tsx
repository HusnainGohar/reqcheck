import * as React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from "../../auth/AuthContext";
import { Icon } from "../ui/Icon";

export function PublicLayout(props: { children: React.ReactNode }) {
  const { session, error, checkSession } = useAuth();
  return <div className="public-shell">
    <header className="public-header">
      <ReactRouterDOM.Link className="public-brand" to="/"><Icon name="shield" size={28} /><span className="brand-name">ReqCheck</span></ReactRouterDOM.Link>
      <nav aria-label="Public navigation">
        {session ? <ReactRouterDOM.Link className="secondary-button" to="/workspace">Open workspace</ReactRouterDOM.Link> : <>
          <ReactRouterDOM.Link to="/login">Log in</ReactRouterDOM.Link><ReactRouterDOM.Link className="secondary-button" to="/register">Create account</ReactRouterDOM.Link>
        </>}
      </nav>
    </header>
    {error ? <div className="public-error notice error" role="alert">{error}
      <button type="button" className="ghost-button" onClick={checkSession}>Retry session check</button>
    </div> : null}
    {props.children}
    <footer className="public-footer">ReqCheck · Human-in-the-loop review · Local academic prototype</footer>
  </div>;
}
