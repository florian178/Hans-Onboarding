import React from 'react';
import styles from './Card.module.css';
import { clsx } from 'clsx';

export const Card = ({ children, className = '', onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => {
  return <div className={clsx(styles.card, className)} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>{children}</div>;
};

export const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return <div className={clsx(styles.header, className)}>{children}</div>;
};

export const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return <h3 className={clsx(styles.title, className)}>{children}</h3>;
};

export const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return <div className={clsx(styles.content, className)}>{children}</div>;
};
