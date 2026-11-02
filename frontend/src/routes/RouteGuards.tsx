import * as React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from "../auth/AuthContext";

export function PublicRoute(props: { path?: string; exact?: boolean; anonymousOnly?: boolean; children: React.ReactNode }) {
  const auth = useAuth();
  return <ReactRouterDOM.Route path={props.path} exact={props.exact} render={function() {
    return props.anonymousOnly && auth.session
      ? <ReactRouterDOM.Redirect to="/workspace" /> : <>{props.children}</>;
  }} />;
}

export function PrivateRoute(props: { path: string; exact?: boolean; accountOnly?: boolean; children: React.ReactNode }) {
  const auth = useAuth();
  return <ReactRouterDOM.Route path={props.path} exact={props.exact} render={function(route) {
    if (!auth.session) return <ReactRouterDOM.Redirect to={{ pathname: '/login', search: '?next=' + encodeURIComponent(route.location.pathname) }} />;
    if (props.accountOnly && auth.session.kind !== 'account') return <ReactRouterDOM.Redirect to="/workspace" />;
    return <>{props.children}</>;
  }} />;
}

export function RouteFocus() {
  const location = ReactRouterDOM.useLocation();
  React.useEffect(function() {
    window.scrollTo(0, 0);
    const heading = document.querySelector<HTMLElement>('main h1');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus(); }
  }, [location.pathname]);
  return null;
}
