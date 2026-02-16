import {
  TextField,
  Checkbox,
  FormHelperText,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import React from "react";

// Phone formatter function
const formatPhoneNumber = (value) => {
  if (!value) return value;
  
  // Remove all non-digits
  const phoneNumber = value.replace(/[^\d]/g, "");
  
  // Format based on length
  if (phoneNumber.length < 4) return phoneNumber;
  if (phoneNumber.length < 7) {
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
  }
  return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
};

const FormField = React.memo(function FormField({
  type = "text",
  name,
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  fullWidth = true,
  variant = "outlined",
  className = "",
  unit,
  multiline = false,
  options,
  labels,
  ...props
}) {
  
  // Handle phone number formatting
  const handlePhoneChange = (e) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    // Create a synthetic event with the formatted value
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: e.target.name,
        value: formattedValue,
      },
    };
    onChange(syntheticEvent);
  };

  if (type === "checkbox") {
    // ... checkbox code (unchanged)
    const checkboxId = `checkbox-${name}`;
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Checkbox
          id={checkboxId}
          name={name}
          checked={value || false}
          onChange={onChange}
          disabled={disabled}
          color="primary"
          className="mt-1"
          {...props}
        />
        <div className="flex flex-col">
          <label htmlFor={checkboxId} className="text-sm font-medium text-gray-700 cursor-pointer">
            {label || name}
          </label>
          {helperText && !error && helperText !== false && helperText !== "" && (
            <FormHelperText className="mt-0 text-xs text-gray-500">
              {helperText}
            </FormHelperText>
          )}
          {error && (
            <FormHelperText error className="mt-0">
              {error}
            </FormHelperText>
          )}
        </div>
      </div>
    );
  } else if (type === "select") {
    // ... select code (unchanged)
    return (
      <div className={className}>
        <FormControl fullWidth size="small">
          <InputLabel id={`select-${name}`}>{label}</InputLabel>
          <Select
            name={name}
            value={value || ""}
            onChange={onChange}
            disabled={disabled}
            required={required}
            {...props}
          >
            {options?.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label || option.value}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    );
  } else if (type === "tel" || type === "phone") {
    // Phone number input
    return (
      <div className={className}>
        <TextField
          type="tel"
          name={name}
          label={label}
          value={value || ""}
          onChange={handlePhoneChange}
          error={!!error}
          helperText={error || helperText}
          required={required}
          disabled={disabled}
          placeholder={placeholder || "XXX-XXX-XXXX"}
          fullWidth={fullWidth}
          size="small"
          variant={variant}
          InputProps={{
            endAdornment: unit && <InputAdornment position="end">{unit}</InputAdornment>,
          }}
          inputProps={{
            maxLength: 12, // XXX-XXX-XXXX = 12 characters
            pattern: "[0-9-]*",
            ...props.inputProps
          }}
          {...props}
        />
      </div>
    );
  }

  // Default text field (unchanged)
  return (
    <div className={className}>
      <TextField
        type={type}
        name={name}
        label={label}
        value={
          type === "date" && typeof value === "string"
            ? value.split("T")[0]
            : value || ""
        }
        onChange={onChange}
        error={!!error}
        helperText={error || helperText}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        fullWidth={fullWidth}
        size="small"
        variant={variant}
        multiline={multiline}
        InputLabelProps={type === "date" ? { shrink: true } : undefined}
        InputProps={{
          onWheel:
            type === "number"
              ? (e) => e.target.blur()
              : undefined,
          endAdornment: unit && <InputAdornment position="end">{unit}</InputAdornment>,
        }}
        inputProps={{
          list: type === "list" ? name : undefined,
          ...props.inputProps
        }}
        {...props}
      />

      {type === "list" && (
        <datalist id={name}>
          {labels?.map((label) => (
            <option key={label} value={label} />
          ))}
        </datalist>
      )}
    </div>
  );
});

export default FormField;