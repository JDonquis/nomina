# Reusable Form Components

This directory contains reusable form components that provide consistent styling, validation, loading states, and feedback messages across the application.

## Components

### ReusableForm

A comprehensive form component that handles form state, validation, loading states, and feedback messages automatically.

#### Features

- **Automatic form state management** - No need to manage form data manually
- **Built-in validation** - Support for required fields, patterns, min/max length, and custom validation
- **Loading states** - Automatic loading indicators during form submission
- **Error handling** - Displays validation errors and API errors
- **Feedback integration** - Uses the app's FeedbackContext for success/error messages
- **Flexible field types** - Support for text, email, password, checkbox, and more
- **Customizable styling** - Tailwind CSS classes and Material-UI theming

#### Basic Usage

```jsx
import { ReusableForm } from '../components/forms';

const MyComponent = () => {
  const fields = [
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'user@example.com'
    },
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      required: true
    },
    {
      name: 'isActive',
      label: 'Active User',
      type: 'checkbox',
      helperText: 'Check to activate the user account'
    }
  ];

  const validationRules = {
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    },
    firstName: {
      minLength: 2,
      maxLength: 50
    }
  };

  const handleSubmit = async (formData) => {
    // formData contains all field values
    
    // Make API call
    await api.createUser(formData);
    
    // Success message will be shown automatically
    // Form will be reset if not in a modal
  };

  return (
    <ReusableForm
      fields={fields}
      onSubmit={handleSubmit}
      validationRules={validationRules}
      submitText="Create User"
      cancelText="Cancel"
      onCancel={() => setModalOpen(false)} // Optional
    />
  );
};
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fields` | Array | Required | Array of field configuration objects |
| `onSubmit` | Function | Required | Function called when form is submitted with valid data |
| `submitText` | String | 'Submit' | Text for the submit button |
| `cancelText` | String | 'Cancel' | Text for the cancel button |
| `onCancel` | Function | null | Function called when cancel is clicked |
| `initialData` | Object | {} | Initial form data |
| `validationRules` | Object | {} | Validation rules for fields |
| `className` | String | '' | Additional CSS classes |
| `showCancelButton` | Boolean | true | Whether to show cancel button |
| `submitButtonProps` | Object | {} | Additional props for submit button |
| `cancelButtonProps` | Object | {} | Additional props for cancel button |

#### Field Configuration

Each field object can have the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `name` | String | Field name (used as form data key) |
| `label` | String | Field label |
| `type` | String | Field type: 'text', 'email', 'password', 'checkbox', etc. |
| `required` | Boolean | Whether field is required |
| `placeholder` | String | Placeholder text |
| `helperText` | String | Helper text shown below field |
| `className` | String | CSS classes for field container |
| `disabled` | Boolean | Whether field is disabled |
| `fullWidth` | Boolean | Whether field takes full width (default: true) |

#### Validation Rules

Validation rules are defined per field name:

```jsx
const validationRules = {
  fieldName: {
    minLength: 5,
    maxLength: 100,
    pattern: /regex/,
    message: 'Custom error message',
    custom: (value, formData) => {
      // Return error message or null
      if (value === 'invalid') return 'This value is not allowed';
      return null;
    }
  }
};
```

### FormField

A lower-level component for individual form fields. Used internally by ReusableForm but can be used standalone.

#### Usage

```jsx
import { FormField } from '../components/forms';

<FormField
  name="email"
  label="Email Address"
  type="email"
  value={email}
  onChange={handleChange}
  error={errors.email}
  required
/>
```

## Examples

### Login Form

```jsx
const loginFields = [
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'password', label: 'Password', type: 'password', required: true }
];

<ReusableForm
  fields={loginFields}
  onSubmit={handleLogin}
  submitText="Login"
  showCancelButton={false}
/>
```

### User Creation Form

```jsx
const userFields = [
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'firstName', label: 'First Name', type: 'text', required: true },
  { name: 'lastName', label: 'Last Name', type: 'text', required: true },
  { name: 'isAdmin', label: 'Administrator', type: 'checkbox' }
];

<ReusableForm
  fields={userFields}
  onSubmit={handleCreateUser}
  onCancel={() => setModalOpen(false)}
  submitText="Create User"
/>
```

## Integration with Existing Context

The ReusableForm automatically integrates with:

- **FeedbackContext** - Shows success/error messages
- **Material-UI** - Uses Material-UI components for consistent styling
- **Tailwind CSS** - Supports Tailwind classes for additional styling

## Benefits

1. **Consistency** - All forms look and behave the same way
2. **Less boilerplate** - No need to write form state management code
3. **Built-in validation** - Comprehensive validation system
4. **Loading states** - Automatic loading indicators
5. **Error handling** - Consistent error display
6. **Accessibility** - Material-UI components are accessible by default
7. **Maintainability** - Changes to form behavior affect all forms at once
