import React from 'react';
import { cn } from '../../lib/utils';

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
};

export function FormField({ label, htmlFor, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-xs font-medium text-muted-foreground" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && (
        <span className="text-[11px] text-muted-foreground block mt-0.5">
          {hint}
        </span>
      )}
    </div>
  );
}
