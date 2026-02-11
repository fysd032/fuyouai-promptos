# ErrorBoundary Component

## Overview

`ErrorBoundary` is a React error boundary component that catches JavaScript errors anywhere in the child component tree, logs those errors, and displays a fallback UI instead of crashing the whole app (white screen).

## Why It Exists

### Browser Translation Issue

When users enable browser translation (e.g., Chrome's "Translate to Chinese"), the browser directly modifies DOM text nodes. This breaks React's virtual DOM synchronization:

```
React expects: <button>Generate</button>
Browser shows: <button>鐢熸垚</button>
React update 鈫?DOM mismatch 鈫?Crash (white screen)
```

This component catches these errors and shows a friendly message instead of a blank page.

## Usage

Wrap your components with `ErrorBoundary`:

```tsx
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

## Current Behavior

When an error occurs, the component displays:
- Error icon
- "椤甸潰閬囧埌浜嗕竴浜涢棶棰? (Page encountered some issues)
- Error message details
- "鍒锋柊椤甸潰" (Reload) button
- "杩斿洖瀹樼綉棣栭〉" (Go Home) button

## Recommended Improvements

1. **Add translation warning**: Tell users to disable browser translation
2. **Bilingual messages**: Show both Chinese and English
3. **Error reporting**: Send errors to monitoring service

## Related Files

- `src/components/ModuleRunner.tsx` - Has `` attribute
- `src/components/pages/CoreFrameworkPage.tsx` - Has `` attribute
- `src/components/pages/ModuleRunnerPage.tsx` - Has `` attribute

## Prevention Strategy

Add `translate="no"` and `className=""` to interactive elements (buttons, inputs, forms) to prevent browser translation from modifying them.

