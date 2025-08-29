# StyledButton Component

A highly customizable, reusable button component with support for different states, colors, sizes, and animations.

## Usage

### Basic Button
```html
<!-- Using content projection -->
<app-styled-button (buttonClick)="handleClick()">
  Click me
</app-styled-button>

<!-- Using text attribute -->
<app-styled-button 
  (buttonClick)="handleClick()"
  text="Click me">
</app-styled-button>
```

### Button with Icon
```html
<!-- Using content projection -->
<app-styled-button 
  (buttonClick)="handleClick()"
  icon="add-circle-outline"
  iconSlot="start">
  Add Item
</app-styled-button>

<!-- Using text attribute -->
<app-styled-button 
  (buttonClick)="handleClick()"
  icon="add-circle-outline"
  iconSlot="start"
  text="Add Item">
</app-styled-button>
```

### Router Link Button
```html
<app-styled-button 
  routerLink="/home"
  color="primary"
  variant="outline">
  Go Home
</app-styled-button>
```

### Different Colors and Variants
```html
<!-- Success solid button -->
<app-styled-button color="success" variant="solid">
  Save
</app-styled-button>

<!-- Danger outline button -->
<app-styled-button color="danger" variant="outline">
  Delete
</app-styled-button>

<!-- Primary clear button -->
<app-styled-button color="primary" variant="clear">
  Cancel
</app-styled-button>
```

### Different Sizes
```html
<app-styled-button size="small">Small</app-styled-button>
<app-styled-button size="default">Default</app-styled-button>
<app-styled-button size="large">Large</app-styled-button>
```

### Full Width Button
```html
<!-- Shopping list style button -->
<app-styled-button 
  expand="block" 
  color="success"
  icon="add-circle-outline"
  iconSlot="start"
  text="New Shopping List">
</app-styled-button>

<!-- Generic full width -->
<app-styled-button expand="block" color="success">
  Full Width Button
</app-styled-button>
```

### Icon Only Button
```html
<app-styled-button 
  icon="trash-outline"
  iconSlot="icon-only"
  color="danger"
  size="small">
</app-styled-button>
```

### Loading State
```html
<app-styled-button 
  [loading]="isLoading"
  (buttonClick)="submitForm()">
  Submit
</app-styled-button>
```

### Disabled Button
```html
<app-styled-button 
  [disabled]="true"
  color="primary">
  Disabled
</app-styled-button>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `text` | `string` | `''` | Button text (alternative to content projection) |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'light' \| 'medium' \| 'dark'` | `'primary'` | Button color theme |
| `variant` | `'solid' \| 'outline' \| 'clear'` | `'solid'` | Button style variant |
| `size` | `'small' \| 'default' \| 'large'` | `'default'` | Button size |
| `expand` | `'block' \| 'full' \| ''` | `''` | Button width behavior |
| `disabled` | `boolean` | `false` | Disable the button |
| `loading` | `boolean` | `false` | Show loading state |
| `icon` | `string` | `''` | Ionic icon name |
| `iconSlot` | `'start' \| 'end' \| 'icon-only'` | `'start'` | Icon position |
| `routerLink` | `string \| any[]` | `''` | Angular router link |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Button type |

## Events

| Event | Description |
|-------|-------------|
| `(buttonClick)` | Emitted when button is clicked (not fired when disabled or loading) |

## Features

- ✅ Multiple color themes with proper contrast
- ✅ Hover, active, focus, and disabled states
- ✅ Smooth animations and transitions
- ✅ Loading state with spinner
- ✅ Icon support with flexible positioning
- ✅ Router link support
- ✅ Accessibility features (focus ring, proper ARIA attributes)
- ✅ Touch-friendly design
- ✅ Ripple effect on click
- ✅ Responsive design
