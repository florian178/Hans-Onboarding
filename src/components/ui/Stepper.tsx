import React from 'react';
import styles from './Stepper.module.css';
import { clsx } from 'clsx';
import { FiCheck } from 'react-icons/fi';

export interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStepIndex: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStepIndex }) => {
  return (
    <div className={styles.stepper}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isActive = index === currentStepIndex;
        
        return (
          <div key={step.id} className={styles.step}>
            <div className={styles.indicatorWrapper}>
              <div className={clsx(
                styles.indicator,
                isCompleted && styles.completed,
                isActive && styles.active
              )}>
                {isCompleted ? <FiCheck className={styles.icon} /> : index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={clsx(
                  styles.line,
                  isCompleted && styles.lineCompleted
                )} />
              )}
            </div>
            <div className={styles.content}>
              <h4 className={clsx(styles.title, isActive && styles.titleActive)}>
                {step.title}
              </h4>
              {step.description && (
                <p className={styles.description}>{step.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
