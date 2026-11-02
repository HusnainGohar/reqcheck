import * as React from 'react';
import { Icon } from './Icon';

export interface SectionDisclosure {
  expanded: boolean;
  onToggle: () => void;
}

export function CollapsibleSection(props: SectionDisclosure & {
  id: string;
  headingId: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return <section id={props.id} className="card card-pad collapsible-section" aria-labelledby={props.headingId}>
    <div className="card-heading disclosure-heading">
      <div>
        <h2><button id={props.headingId} type="button" className="section-toggle"
          aria-expanded={props.expanded} aria-controls={props.id + '-content'} onClick={props.onToggle}>
          <span>{props.title}</span>
          <span className="section-toggle-hint" aria-hidden="true">{props.expanded ? 'Collapse' : 'Expand'}</span>
          <span className={'section-chevron' + (props.expanded ? ' expanded' : '')}><Icon name="chevron" /></span>
        </button></h2>
        <p>{props.description}</p>
      </div>
      {props.actions ? <div className="section-actions" hidden={!props.expanded}>{props.actions}</div> : null}
    </div>
    <div id={props.id + '-content'} hidden={!props.expanded}>{props.children}</div>
  </section>;
}
