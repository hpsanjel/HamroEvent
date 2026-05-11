# Accessibility Widget

This application includes a comprehensive accessibility widget inspired by Norwegian government websites, providing users with various accessibility options to improve their browsing experience.

## Features

### 🎯 Core Accessibility Features

1. **High Contrast Mode** - Increases color contrast for better readability
2. **Large Text Mode** - Enlarges all text elements for improved visibility
3. **Font Size Adjustment** - Slider control (80% - 200%) for precise text sizing
4. **Hide Images** - Removes decorative images and shows "[Image]" placeholders
5. **Black & White Mode** - Converts entire interface to grayscale
6. **Dark Mode** - Switches to dark theme for reduced eye strain
7. **Reduced Motion** - Disables animations and transitions
8. **Enhanced Focus** - Improves keyboard navigation visibility

## How to Use

1. **Access the Widget**: Click the accessibility icon (👤) in the bottom-right corner of any page
2. **Configure Settings**: Toggle switches and adjust sliders to customize your experience
3. **Reset Options**: Click "Reset" to restore default settings
4. **Persistent Settings**: Your preferences are automatically saved and persist across sessions

## Technical Implementation

### Components

- **`AccessibilityWidget.tsx`** - Main widget component with floating button and settings panel
- **`AccessibilityTest.tsx`** - Demo component showcasing all accessibility features
- **CSS Classes** - Comprehensive styling for all accessibility modes in `styles.css`

### Key Features

#### Local Storage Integration
```typescript
// Settings are automatically saved to localStorage
localStorage.setItem('accessibility-settings', JSON.stringify(settings));
```

#### Dynamic CSS Class Application
```typescript
// Settings are applied as CSS classes to the document root
root.classList.add('high-contrast', 'large-text', 'hide-images', 'grayscale');
```

#### Responsive Design
- Floating button positioned fixed in bottom-right corner
- Settings panel with proper z-index (9999) to stay above all content
- Mobile-friendly touch targets and responsive layout

## CSS Classes Reference

### High Contrast (`.high-contrast`)
- Pure black and white color scheme
- Maximum contrast ratios for WCAG AAA compliance
- Enhanced borders and outlines

### Large Text (`.large-text`)
- 120% base font size with 1.6 line height
- Scaled heading sizes (h1: 2.5rem, h2: 2rem, etc.)
- Improved readability for users with low vision

### Hide Images (`.hide-images`)
- Hides all `img`, `svg`, and `[role="img"]` elements
- Shows "[Image]" placeholders for context
- Preserves important icon functionality

### Grayscale (`.grayscale`)
- Applies `filter: grayscale(100%)` to entire page
- Helps users with color blindness preferences
- Reduces visual distractions

### Dark Mode (`.dark-mode`)
- Dark color scheme optimized for reduced eye strain
- Maintains accessibility contrast ratios
- Compatible with system dark mode preferences

### Reduced Motion (`.reduced-motion`)
- Disables all animations and transitions
- Sets `animation-duration: 0.01ms` and `transition-duration: 0.01ms`
- Respects `prefers-reduced-motion` user preferences

### Enhanced Focus (`.focus-visible`)
- 3px solid outline with 2px offset
- Enhanced box-shadow for keyboard navigation
- Improved visibility for all interactive elements

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Accessibility Standards

This widget follows WCAG 2.1 AA guidelines:

- **Perceivable**: High contrast, text resizing, image alternatives
- **Operable**: Keyboard navigation, reduced motion, focus indicators
- **Understandable**: Clear labels, consistent interface
- **Robust**: Semantic HTML, ARIA attributes, cross-browser compatibility

## Testing

Use the built-in `AccessibilityTest` component to verify all features:

1. Navigate to the main application
2. Scroll to the "Accessibility Features Test" section
3. Test each setting using the floating widget
4. Verify changes apply immediately and persist

## Customization

### Adding New Features

1. Update the `AccessibilitySettings` interface in `AccessibilityWidget.tsx`
2. Add corresponding CSS classes in `styles.css`
3. Include UI controls in the widget panel
4. Update the `applySettings` function

### Styling Customization

Modify the CSS variables in `styles.css` to match your brand:

```css
.high-contrast {
  --background: oklch(0.05 0 0);
  --foreground: oklch(1 0 0);
  /* ... other variables */
}
```

## Keyboard Shortcuts (Future Enhancement)

Consider adding keyboard shortcuts for quick access:
- `Alt + A`: Toggle accessibility widget
- `Alt + C`: Toggle high contrast
- `Alt + T`: Toggle large text
- `Alt + D`: Toggle dark mode

## Contributing

When contributing to the accessibility widget:

1. Test all screen readers (NVDA, JAWS, VoiceOver)
2. Verify keyboard navigation works without a mouse
3. Test with various assistive technologies
4. Ensure WCAG compliance for new features
5. Test across different browsers and devices

## Support

For accessibility-related issues or suggestions, please ensure:

- All interactive elements are keyboard accessible
- Color contrast ratios meet WCAG standards
- Text alternatives are provided for non-text content
- Forms have proper labels and error handling
- Focus management is logical and predictable
