import { LoaderCircle } from 'lucide-react';
import { cn } from '../lib/cn';
import { ui } from '../lib/ui';

export function SectionHead({ eyebrow, title, description, action, isDark }) {
  return (
    <div className={ui.sectionHead}>
      <div>
        {eyebrow && <p className={ui.eyebrow}>{eyebrow}</p>}
        <h2 className={ui.h2}>{title}</h2>
        {description && <p className={ui.muted(isDark)}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingBlock({ text = 'Loading...', isDark }) {
  return <div className={ui.loading(isDark)}><LoaderCircle className="animate-spin" size={20}/>{text}</div>;
}

export function EmptyBlock({ icon, title, description, action, isDark }) {
  return (
    <div className={ui.empty(isDark)}>
      <span className={ui.emptyIcon}>{icon}</span>
      <h3 className={ui.h3}>{title}</h3>
      {description && <p className={cn('mt-2 max-w-sm text-xs leading-relaxed', ui.muted(isDark))}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ModalShell({ isDark, onClose, children }) {
  return (
    <div className={ui.modalBackdrop} onClick={onClose}>
      <div className={ui.modal(isDark)} onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

export function FormField({ label, isDark, children }) {
  return <label className={ui.label(isDark)}>{label}{children}</label>;
}

export function StatusPill({ status }) {
  return <span className={ui.pill(status)}>{status}</span>;
}
