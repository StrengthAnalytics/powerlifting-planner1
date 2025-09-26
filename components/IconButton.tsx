import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const IconButton: React.FC<IconButtonProps> = ({ icon, children, variant = 'primary', ...props }) => {
  const baseClasses = "flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm";
  
  const variantClasses = {
    primary: "bg-slate-800 hover:bg-slate-700 focus:ring-slate-500",
    secondary: "bg-slate-500 hover:bg-slate-600 focus:ring-slate-400"
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {icon}
      <span>{children}</span>
    </button>
  );
};

export default IconButton;
