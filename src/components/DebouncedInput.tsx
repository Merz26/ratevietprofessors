import React, { useState, useEffect, useRef, forwardRef, InputHTMLAttributes } from 'react';

export interface DebouncedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onImmediateChange?: (value: string) => void;
  debounceMs?: number;
}

const DebouncedInput = forwardRef<HTMLInputElement, DebouncedInputProps>(function DebouncedInput({ 
  value: initialValue, 
  onChange, 
  onImmediateChange,
  debounceMs = 300, 
  ...props 
}, ref) {
  const [value, setValue] = useState(initialValue);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (value !== initialValue) {
      setValue(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      onChangeRef.current(value);
    }, debounceMs);
    
    return () => clearTimeout(timeout);
  }, [value, debounceMs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onImmediateChange) {
      onImmediateChange(newValue);
    }
  };

  return (
    <input
      ref={ref}
      {...props}
      value={value}
      onChange={handleChange}
    />
  );
});

export default DebouncedInput;
