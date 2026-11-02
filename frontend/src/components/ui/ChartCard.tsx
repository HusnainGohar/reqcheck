import * as React from 'react';
import { Icon } from "./Icon";

export function ChartCard(props: { title: string; src?: string; alt: string }) {
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [retry, setRetry] = React.useState(0);
  React.useEffect(function() { setLoaded(false); setFailed(false); }, [props.src, retry]);
  return <figure>
    <figcaption>{props.title}</figcaption>
    {props.src ? <>
      {!loaded && !failed ? <div className="chart-placeholder" role="status"><span className="spinner" />Loading chart…</div> : null}
      {failed ? <div className="chart-placeholder" role="alert"><Icon name="chart" /><p>Chart could not load.</p>
        <button type="button" className="ghost-button" onClick={function() { setRetry(retry + 1); }}>Retry chart</button></div> : null}
      <img style={{ display: loaded ? 'block' : 'none' }} src={props.src + (props.src.indexOf('?') < 0 ? '?' : '&') + 'retry=' + retry}
        alt={props.alt} onLoad={function() { setLoaded(true); setFailed(false); }} onError={function() { setFailed(true); setLoaded(false); }} />
    </> : <div className="chart-placeholder"><Icon name="chart" size={24} />
        <div className="placeholder-bars" aria-hidden="true"><span /><span /><span /></div>
        <p>Available after your first analysis.<br />Illustration only — no results yet.</p></div>}
  </figure>;
}
