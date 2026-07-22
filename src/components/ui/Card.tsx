import { ReactNode } from "react";

interface CardProps {
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Card({ title, action, className, children }: CardProps) {
  return (
    <section className={`card${className ? ` ${className}` : ""}`}>
      {title && (
        <div className="card__title">
          <span>{title}</span>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
