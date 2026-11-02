import * as React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from "../../auth/AuthContext";
import { Icon } from "../ui/Icon";

export function AccountMenu(props: { disabled?: boolean }) {
  const { session, busy, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const container = React.useRef<HTMLDivElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  React.useEffect(function() {
    if (!open) return;
    function closeOutside(event: MouseEvent) {
      if (container.current && !container.current.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    }
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', escape);
    return function() {
      document.removeEventListener('mousedown', closeOutside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  const name = session && session.kind === 'account' ? session.name || 'Reviewer' : 'Guest';
  return <div className="account-menu" ref={container} onBlur={function(event) {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
  }}>
    <button ref={trigger} type="button" className="account-trigger icon-button" aria-label="Account options"
      aria-expanded={open} aria-controls="account-options" onClick={function() { setOpen(!open); }}>
      <Icon name="user" size={23} />
    </button>
    {open ? <section className="account-popover" id="account-options" aria-label="Account options">
      <div className="account-identity"><span className="account-avatar"><Icon name="user" size={25} /></span>
        <div><strong>{name}</strong><p>{session && session.kind === 'account' ? session.email : 'Temporary workspace'}</p></div>
      </div>
      {session && session.kind === 'account' ? <ReactRouterDOM.Link className={'secondary-button' + (props.disabled || busy ? ' disabled-link' : '')}
        to="/account/password" aria-disabled={props.disabled || busy} onClick={function(event) {
          if (props.disabled || busy) event.preventDefault(); else setOpen(false);
        }}><Icon name="shield" />Change Password</ReactRouterDOM.Link> :
        <><button type="button" className="secondary-button" disabled><Icon name="shield" />Change Password</button><p className="access-help">Guests do not have a password.</p></>}
      <button type="button" className="danger-button" disabled={props.disabled || busy} onClick={function() { setOpen(false); logout(); }}>
        <Icon name="arrow" />{session && session.kind === 'guest' ? 'Logout / end guest session' : 'Logout'}
      </button>
      {props.disabled ? <p className="access-help">Finish saving your changes before leaving.</p> : null}
    </section> : null}
  </div>;
}
