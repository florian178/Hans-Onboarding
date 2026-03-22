import React, { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className={styles.wrapper}>
        {label && <label className={styles.label} htmlFor={props.id}>{label}</label>}
        <input 
          ref={ref}
          className={clsx(
            styles.input,
            error && styles.hasError,
            className
          )}
          {...props}
        />
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
