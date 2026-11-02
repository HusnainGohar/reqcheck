import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ReactQueryConfigProvider } from 'react-query';
import * as ReactRouterDOM from 'react-router-dom';
import { Site } from "./routes/AppRoutes";

ReactDOM.render(<ReactQueryConfigProvider config={{ retry: false, refetchAllOnWindowFocus: false, throwOnError: true }}><ReactRouterDOM.HashRouter><Site /></ReactRouterDOM.HashRouter></ReactQueryConfigProvider>, document.getElementById('root'));

