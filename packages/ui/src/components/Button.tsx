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
    primary: 'bg-gradient-to-r from-[#FFC928] via-[#FFB000] to-[#E96800] text-[#120E09] font-semibold hover:from-[#FFD752] hover:to-[#FF8A00] active:from-[#E69500] active:to-[#D95B00] shadow-[0_0_15px_rgba(255,176,0,0.25)] focus-visible:ring-[#FFB000]',
    secondary: 'bg-[#1A140D] text-[#FFF8EE] border border-[#3A2A1A] hover:bg-[#251C12] hover:border-[#96744C] focus-visible:ring-[#FFB000]',
    ghost: 'text-[#D4C4B0] hover:text-[#FFF8EE] hover:bg-[#1A140D] focus-visible:ring-[#FFB000]',
    danger: 'bg-[#F2555A] text-white hover:bg-[#d9484d] active:bg-[#c23d42] focus-visible:ring-[#F2555A]',
    link: 'text-[#FFB000] underline-offset-4 hover:underline p-0 h-auto'
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
