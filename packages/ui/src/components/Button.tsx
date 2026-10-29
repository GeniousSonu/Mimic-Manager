import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none';

  const variants = {
    primary: 'bg-[#7C6CFF] text-white hover:bg-[#8F81FF] active:bg-[#6A59F0] focus-visible:ring-[#7C6CFF]',
    secondary: 'bg-[#161A23] text-[#E9ECF3] border border-[#2A3040] hover:bg-[#1C212C] hover:border-[#626D85] focus-visible:ring-[#7C6CFF]',
    ghost: 'text-[#A5AEC0] hover:text-[#E9ECF3] hover:bg-[#161A23] focus-visible:ring-[#7C6CFF]',
    danger: 'bg-[#F2555A] text-white hover:bg-[#d9484d] active:bg-[#c23d42] focus-visible:ring-[#F2555A]',
    link: 'text-[#7C6CFF] underline-offset-4 hover:underline p-0 h-auto'
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5'
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        isLoading && 'cursor-wait',
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!isLoading && leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};

Button.displayName = 'Button';
