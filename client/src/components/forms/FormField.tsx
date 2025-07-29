import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';

interface FormFieldProps extends Omit<TextFieldProps, 'name' | 'error' | 'helperText'> {
  name: string;
  label: string;
  rules?: object;
}

const FormField: React.FC<FormFieldProps> = ({ name, label, rules, ...textFieldProps }) => {
  const { control, formState: { errors } } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <TextField
          {...field}
          {...textFieldProps}
          label={label}
          error={!!errors[name]}
          helperText={errors[name]?.message as string}
          fullWidth
          margin="normal"
        />
      )}
    />
  );
};

export default FormField; 