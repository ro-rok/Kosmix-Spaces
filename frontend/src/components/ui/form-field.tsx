/**
 * Enhanced form field component with real-time validation feedback
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

// Base form field props
interface BaseFormFieldProps {
  name: string;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  validating?: boolean;
}

// Input field props
interface InputFieldProps extends BaseFormFieldProps {
  type?: "text" | "email" | "password" | "tel" | "url" | "number";
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  autoComplete?: string;
  maxLength?: number;
}

// Textarea field props
interface TextareaFieldProps extends BaseFormFieldProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  rows?: number;
  maxLength?: number;
}

// Select field props
interface SelectFieldProps extends BaseFormFieldProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

// Checkbox field props
interface CheckboxFieldProps extends BaseFormFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onBlur?: () => void;
}

// Switch field props
interface SwitchFieldProps extends BaseFormFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onBlur?: () => void;
}

// Field wrapper component
function FieldWrapper({ 
  children, 
  label, 
  description, 
  error, 
  required, 
  className,
  validating,
  name 
}: {
  children: React.ReactNode;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  validating?: boolean;
  name: string;
}) {
  const hasError = Boolean(error);
  const isValid = !hasError && !validating;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center gap-2">
          <Label 
            htmlFor={name}
            className={cn(
              "text-sm font-medium",
              hasError && "text-destructive",
              required && "after:content-['*'] after:ml-0.5 after:text-destructive"
            )}
          >
            {label}
          </Label>
          {validating && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
          {isValid && (
            <CheckCircle2 className="h-3 w-3 text-success" />
          )}
        </div>
      )}
      
      {children}
      
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {error && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Input field component
export function InputField({
  name,
  label,
  description,
  error,
  required,
  disabled,
  className,
  validating,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  autoComplete,
  maxLength
}: InputFieldProps) {
  const hasError = Boolean(error);

  return (
    <FieldWrapper
      name={name}
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
      validating={validating}
    >
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className={cn(
          hasError && "border-destructive focus-visible:ring-destructive",
          validating && "border-muted-foreground/50"
        )}
        aria-invalid={hasError}
        aria-describedby={error ? `${name}-error` : undefined}
      />
    </FieldWrapper>
  );
}

// Textarea field component
export function TextareaField({
  name,
  label,
  description,
  error,
  required,
  disabled,
  className,
  validating,
  placeholder,
  value,
  onChange,
  onBlur,
  rows = 3,
  maxLength
}: TextareaFieldProps) {
  const hasError = Boolean(error);
  const characterCount = value.length;

  return (
    <FieldWrapper
      name={name}
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
      validating={validating}
    >
      <div className="space-y-1">
        <Textarea
          id={name}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={cn(
            hasError && "border-destructive focus-visible:ring-destructive",
            validating && "border-muted-foreground/50"
          )}
          aria-invalid={hasError}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        {maxLength && (
          <div className="flex justify-end">
            <span className={cn(
              "text-xs",
              characterCount > maxLength * 0.9 ? "text-warning" : "text-muted-foreground",
              characterCount >= maxLength && "text-destructive"
            )}>
              {characterCount}/{maxLength}
            </span>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}

// Select field component
export function SelectField({
  name,
  label,
  description,
  error,
  required,
  disabled,
  className,
  validating,
  placeholder,
  value,
  onChange,
  onBlur,
  options
}: SelectFieldProps) {
  const hasError = Boolean(error);

  return (
    <FieldWrapper
      name={name}
      label={label}
      description={description}
      error={error}
      required={required}
      className={className}
      validating={validating}
    >
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            hasError && "border-destructive focus:ring-destructive",
            validating && "border-muted-foreground/50"
          )}
          onBlur={onBlur}
          aria-invalid={hasError}
          aria-describedby={error ? `${name}-error` : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldWrapper>
  );
}

// Checkbox field component
export function CheckboxField({
  name,
  label,
  description,
  error,
  required,
  disabled,
  className,
  validating,
  checked,
  onChange,
  onBlur
}: CheckboxFieldProps) {
  const hasError = Boolean(error);

  return (
    <FieldWrapper
      name={name}
      description={description}
      error={error}
      required={required}
      className={className}
      validating={validating}
    >
      <div className="flex items-center space-x-2">
        <Checkbox
          id={name}
          name={name}
          checked={checked}
          onCheckedChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={cn(
            hasError && "border-destructive data-[state=checked]:bg-destructive"
          )}
          aria-invalid={hasError}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        {label && (
          <Label 
            htmlFor={name}
            className={cn(
              "text-sm font-medium cursor-pointer",
              hasError && "text-destructive",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {label}
            {required && <span className="ml-0.5 text-destructive">*</span>}
          </Label>
        )}
      </div>
    </FieldWrapper>
  );
}

// Switch field component
export function SwitchField({
  name,
  label,
  description,
  error,
  required,
  disabled,
  className,
  validating,
  checked,
  onChange,
  onBlur
}: SwitchFieldProps) {
  const hasError = Boolean(error);

  return (
    <FieldWrapper
      name={name}
      description={description}
      error={error}
      required={required}
      className={className}
      validating={validating}
    >
      <div className="flex items-center justify-between space-x-2">
        {label && (
          <Label 
            htmlFor={name}
            className={cn(
              "text-sm font-medium",
              hasError && "text-destructive",
              disabled && "opacity-50"
            )}
          >
            {label}
            {required && <span className="ml-0.5 text-destructive">*</span>}
          </Label>
        )}
        <Switch
          id={name}
          name={name}
          checked={checked}
          onCheckedChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          className={cn(
            hasError && "data-[state=checked]:bg-destructive data-[state=unchecked]:bg-destructive/20"
          )}
          aria-invalid={hasError}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      </div>
    </FieldWrapper>
  );
}

// Form section component for grouping fields
export function FormSection({
  title,
  description,
  children,
  className
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

// Form grid for responsive layouts
export function FormGrid({
  children,
  columns = 1,
  className
}: {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 1 && "grid-cols-1",
      columns === 2 && "grid-cols-1 sm:grid-cols-2",
      columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      className
    )}>
      {children}
    </div>
  );
}