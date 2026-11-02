import * as React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from "../../auth/AuthContext";
import { Icon } from "../ui/Icon";
import { AccountMenu } from "./AccountMenu";

export function PrivatePage(props: { children: React.ReactNode; busy?: boolean }) {
  const { error } = useAuth();
  return <div className="private-page">
    <header className="topbar">
      <ReactRouterDOM.Link className="public-brand" to="/workspace"><Icon name="shield" size={25} /><span className="brand-name">ReqCheck</span></ReactRouterDOM.Link>
      <div className="topbar-right"><AccountMenu disabled={props.busy} /></div>
    </header>
    {error ? <p className="public-error notice error" role="alert">{error}</p> : null}
    {props.children}
  </div>;
}
