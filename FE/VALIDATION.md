# Frontend Validation Guide

This document explains how to use validation in the frontend application.

## Overview

All form validations are **derived from backend DTOs** (not hardcoded) to ensure consistency:
- **Backend DTOs**: `wdp-be/src/commons/dtos/user.dto.ts`
- **Frontend validation**: `FE/src/lib/validations.ts`
- **Role enum**: `wdp-be/src/commons/enums/role.enum.ts` → `FE/src/lib/validations.ts`

The validation rules are automatically synchronized with the backend through comments documenting the DTO constraints.

## Backend DTO Reference

### CreateUserDto (wdp-be/src/commons/dtos/user.dto.ts)
```typescript
name: @IsString(), @MinLength(5), @MaxLength(100)
email: @IsEmail()
role: @IsEnum(ROLES)
password: @IsString(), @MinLength(6)
```

### UpdateUserDto
```typescript
name?: @IsString(), @MinLength(5), @MaxLength(100)
email?: @IsEmail()
role?: @IsEnum(ROLES)
password: NOT included (use separate endpoint)
```

## Validation Structure

Each field validation object contains:
- `required`: Whether the field is required
- `minLength` / `maxLength`: String length constraints (from @MinLength/@MaxLength)
- `pattern`: Regex pattern for format validation
- `validValues`: Allowed enum values (from @IsEnum)
- `errorMsg`: Object with error messages for each validation rule

```typescript
fieldName: {
  required: boolean,
  minLength?: number,        // from @MinLength()
  maxLength?: number,        // from @MaxLength()
  pattern?: RegExp,          // custom pattern
  validValues?: number[],    // from @IsEnum()
  errorMsg: {
    required: string,
    minLength?: string,
    maxLength?: string,
    pattern?: string,
    invalid?: string,
  }
}
```

## Usage

### 1. Import Validation and Roles

```typescript
import { userFormValidation, validateField, ROLES } from '@/lib/validations'
import { roleLabels } from '@/lib/constants'
```

### 2. Add Error State to Form

```typescript
const [formData, setFormData] = useState({
  fullName: '',
  email: '',
  password: '',
  role: ROLES.CUSTOMER,
})

const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({})
```

### 3. Validate on Change

```typescript
const handleFieldChange = (fieldName: string, value: string | number) => {
  setFormData({ ...formData, [fieldName]: value })
  
  // Validate and show error
  const error = validateField(fieldName as keyof typeof userFormValidation, value)
  setFieldErrors({ ...fieldErrors, [fieldName]: error })
}
```

### 4. Validate on Submit

```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  
  // Validate all fields
  const errors: Record<string, string | null> = {}
  let hasErrors = false
  
  for (const [key, value] of Object.entries(formData)) {
    const error = validateField(key as keyof typeof userFormValidation, value)
    if (error) {
      errors[key] = error
      hasErrors = true
    }
  }
  
  if (hasErrors) {
    setFieldErrors(errors)
    return
  }
  
  // Submit form
  submitForm()
}
```

### 5. Display Error Messages in UI

```typescript
import { TextField, Select, MenuItem } from '@mui/material'

<TextField
  label="Full Name"
  value={formData.fullName}
  onChange={(e) => handleFieldChange('fullName', e.target.value)}
  error={!!fieldErrors.fullName}
  helperText={fieldErrors.fullName}
  fullWidth
/>

<Select
  value={formData.role}
  onChange={(e) => handleFieldChange('role', e.target.value)}
  label="Role"
>
  {Object.entries(ROLES).map(([label, value]) => (
    <MenuItem key={value} value={value}>
      {roleLabels[value]}
    </MenuItem>
  ))}
</Select>
```

## Adding New Validations

1. **Update backend DTO first** in `wdp-be/src/commons/dtos/user.dto.ts`
2. **Document the DTO constraint** in the comments of `src/lib/validations.ts`
3. **Add field validation** to `userFormValidation` object
4. **Use `validateField()`** in your components

Example:
```typescript
// In wdp-be/src/commons/dtos/user.dto.ts
export class CreateUserDto {
  @IsString()
  @MinLength(5)      // Add this constraint
  @MaxLength(100)
  name: string;
}

// In FE/src/lib/validations.ts
// Add comment documenting the constraint
newField: {
  required: true,
  minLength: 5,      // @MinLength(5)
  maxLength: 100,    // @MaxLength(100)
  errorMsg: { ... }
}
```

## Frontend-Backend Sync Checklist

When updating validation:
- [ ] Update backend DTO with new @decorators
- [ ] Add comment in `src/lib/validations.ts` documenting the DTO constraint
- [ ] Update `userFormValidation` with new rules
- [ ] Test validation in form components
- [ ] Verify error messages are clear

## Files Reference

- **Backend DTOs**: `wdp-be/src/commons/dtos/user.dto.ts`
- **Backend Roles**: `wdp-be/src/commons/enums/role.enum.ts`
- **Frontend Validation**: `FE/src/lib/validations.ts`
- **Frontend Constants**: `FE/src/lib/constants.ts`

