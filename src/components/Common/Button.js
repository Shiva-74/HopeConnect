import React from 'react';

const Button = ({ children, onClick, type = 'button', className = 'btn-primary', disabled = false, style, ...props }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn ${className}`}
      disabled={disabled}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;