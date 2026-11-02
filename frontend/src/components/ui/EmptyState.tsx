import * as React from 'react';
import { Icon, iconPaths } from "./Icon";

export function EmptyState(props: { icon: keyof typeof iconPaths; title: string; description: string; children?: React.ReactNode }) {
  return <div className="empty-state">
    <div className="empty-icon"><Icon name={props.icon} size={25} /></div>
    <h3>{props.title}</h3><p>{props.description}</p>{props.children}
  </div>;
}
