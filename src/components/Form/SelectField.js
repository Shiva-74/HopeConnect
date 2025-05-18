import React from 'react';

const SelectField = ({ label, id, name, value, onChange, options, required, disabled, error, helpText, className = '' }) => {
  const selectName = name || id;
  return (
    <div className={`form-group ${className}`}>
      {label && <label htmlFor={id}>{label}{required && <span style={{color: 'red', marginLeft: '2px'}}>*</span>}</label>}
      <select
        id={id}
        name={selectName}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-describedby={error ? `${selectName}-error` : helpText ? `${selectName}-help` : undefined}
        aria-invalid={!!error}
        style={error ? { borderColor: 'red' } : {}}
      >
        <option value="" disabled={required || value !== ""}>
          Select {label?.toLowerCase() || 'an option'}...
        </option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <small id={`${selectName}-error`} className="form-error-text" role="alert">{error}</small>}
      {helpText && !error && <small id={`${selectName}-help`} className="form-help-text">{helpText}</small>}
    </div>
  );
};

export default SelectField;