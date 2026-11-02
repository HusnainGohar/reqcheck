import * as React from 'react';
import { Icon } from "./Icon";

export function PasswordField(props: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password'; disabled?: boolean;
  invalid?: boolean; describedBy?: string;
}) {
  const [visible, setVisible] = React.useState(false);
  return <div className="password-field">
    <input id={props.id} className="text-input" type={visible ? 'text' : 'password'}
      required minLength={12} maxLength={128} autoComplete={props.autoComplete}
      value={props.value} disabled={props.disabled} aria-invalid={props.invalid || undefined}
      aria-describedby={props.describedBy} onChange={function(event) { props.onChange(event.target.value); }} />
    <button type="button" className="password-toggle" disabled={props.disabled}
      aria-label={(visible ? 'Hide ' : 'Show ') + props.label.toLowerCase()} aria-pressed={visible}
      onClick={function() { setVisible(!visible); }}><Icon name={visible ? 'eyeOff' : 'eye'} /></button>
  </div>;
}
