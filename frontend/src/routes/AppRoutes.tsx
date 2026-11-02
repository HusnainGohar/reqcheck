import * as React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AuthContext } from "../auth/AuthContext";
import { useAuthSession } from '../auth/useAuthSession';
import { PublicLayout } from "../components/layout/PublicLayout";
import { AccessPage } from "../pages/AccessPage";
import { EndGuestPage } from "../pages/EndGuestPage";
import { HomePage } from "../pages/HomePage";
import { PasswordPage } from "../pages/PasswordPage";
import { WorkspacePage } from "../pages/WorkspacePage";
import { PrivateRoute, PublicRoute, RouteFocus } from "./RouteGuards";

export function Site() {
  const { session, checking, error, busy, checkSession, authenticate, logout } = useAuthSession();
  if (checking) return <main className="access-shell"><div className="access-card loading" role="status"><span className="spinner" />Checking your session…</div></main>;
  return <AuthContext.Provider value={{ session, error, busy, checkSession, authenticate, logout }}>
    <RouteFocus />
    <ReactRouterDOM.Switch>
      <ReactRouterDOM.Route exact path="/home"><ReactRouterDOM.Redirect to="/" /></ReactRouterDOM.Route>
      <PublicRoute exact path="/"><PublicLayout><HomePage /></PublicLayout></PublicRoute>
      <PublicRoute exact anonymousOnly path="/login"><PublicLayout><AccessPage key="login" kind="login" /></PublicLayout></PublicRoute>
      <PublicRoute exact anonymousOnly path="/register"><PublicLayout><AccessPage key="register" kind="register" /></PublicLayout></PublicRoute>
      <PublicRoute exact anonymousOnly path="/guest"><PublicLayout><AccessPage key="guest" kind="guest" /></PublicLayout></PublicRoute>
      <PrivateRoute exact path="/workspace"><WorkspacePage /></PrivateRoute>
      <PrivateRoute exact accountOnly path="/account/password"><PasswordPage /></PrivateRoute>
      <PrivateRoute exact path="/end-guest"><EndGuestPage /></PrivateRoute>
      <PublicRoute><PublicLayout><main className="access-shell"><section className="access-card"><h1>Page not found</h1><p>This address does not match a ReqCheck page.</p><ReactRouterDOM.Link className="primary-button" to="/">Back to start</ReactRouterDOM.Link></section></main></PublicLayout></PublicRoute>
    </ReactRouterDOM.Switch>
  </AuthContext.Provider>;
}
