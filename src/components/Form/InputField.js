import React from 'react';

const InputField = ({ label, type, id, name, value, onChange, placeholder, required, disabled, error, helpText, autoComplete, className = '' }) => {
  const inputName = name || id;
  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={id}>{label}{required && <span style={{color: 'red', marginLeft: '2px'}}>*</span>}</label>}
      <input
        type={type}
        id={id}
        name={inputName}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-describedby={error ? `${inputName}-error` : helpText ? `${inputName}-help` : undefined}
        aria-invalid={!!error}
        style={error ? { borderColor: 'red' } : {}}
        autoComplete={autoComplete}
      />
      {error && <small id={`${inputName}-error`} className="form-error-text" role="alert">{error}</small>}
      {helpText && !error && <small id={`${inputName}-help`} className="form-help-text">{helpText}</small>}
    </div>
  );
};

// Add to your App.css or a global form styles file:
// .form-error-text { color: red; display: block; margin-top: 4px; font-size: 0.85rem; }
// .form-help-text { color: #6c757d; display: block; margin-top: 4px; font-size: 0.85rem; }

export default InputField;