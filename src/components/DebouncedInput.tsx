import React, { useState, useEffect, InputHTMLAttributes } from 'react';

interface DebouncedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onImmediateChange?: (value: string) => void;
  debounceMs?: number;
}

export default function DebouncedInput({ 
  value: initialValue, 
  onChange,
  onImmediateChange,
  debounceMs = 300, 
  ...props 
}: DebouncedInputProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (value !== initialValue) {
      setValue(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounceMs);
    
    return () => clearTimeout(timeout);
  }, [value, debounceMs, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onImmediateChange) {
      onImmediateChange(newValue);
    }
  };

  return (
    <input
      {...props}
      value={value}
      onChange={handleChange}
    />
  );
}
