# UI Refactor Plan: Theme Architecture

**Created:** 2026-01-24  
**Status:** Planning  
**Estimated Effort:** 5-7 days

---

## Overview

This document outlines the strategy for supporting multiple UI themes (Retro Windows 95 vs Modern) within a single codebase, enabling A/B testing and user preference switching.

---

## Current Architecture

```
src/
├── components/
│   ├── Fretboard.tsx         ← Core (theme-agnostic rendering)
│   ├── AlphaTabPlayer.tsx    ← Core (minimal styling)
│   ├── RetroWindow.tsx       ← Theme-specific (Retro)
│   ├── DesktopIcon.tsx       ← Theme-specific (Retro)
│   ├── InfoPanel.tsx         ← Theme-specific (Retro)
│   └── YouTubePlayer.tsx     ← Core
├── app/
│   ├── globals.css           ← Mixed (tokens + retro styles)
│   └── page.tsx              ← Layout (retro-specific)
└── lib/
    └── engine/               ← Pure logic (no UI)
```

---

## Target Architecture

```
src/
├── components/
│   ├── core/                         ← Theme-agnostic
│   │   ├── Fretboard.tsx             ← Accepts color tokens as props
│   │   ├── AlphaTabPlayer.tsx
│   │   └── YouTubePlayer.tsx
│   │
│   ├── ui/
│   │   ├── retro/                    ← Windows 95 theme
│   │   │   ├── Window.tsx
│   │   │   ├── DesktopIcon.tsx
│   │   │   ├── InfoPanel.tsx
│   │   │   └── Button.tsx
│   │   │
│   │   └── modern/                   ← Modern theme (shadcn/ui)
│   │       ├── Card.tsx
│   │       ├── Sidebar.tsx
│   │       ├── InfoPanel.tsx
│   │       └── Button.tsx
│   │
│   └── layout/
│       ├── RetroLayout.tsx           ← Desktop + windows composition
│       └── ModernLayout.tsx          ← Clean app shell
│
├── themes/
│   ├── tokens.ts                     ← Shared design tokens
│   ├── retro.css                     ← Retro-specific styles
│   └── modern.css                    ← Modern-specific styles
│
├── context/
│   └── ThemeContext.tsx              ← Theme switching logic
│
└── lib/engine/                       ← Unchanged (pure logic)
```

---

## Refactor Phases

### Phase 1: Extract Core Components (1-2 days)

**Goal:** Separate theme-agnostic logic from styling

| Component | Action | Complexity |
|-----------|--------|------------|
| `Fretboard.tsx` | Move to `core/`, accept color props | Low |
| `AlphaTabPlayer.tsx` | Move to `core/`, minimal changes | Low |
| `YouTubePlayer.tsx` | Move to `core/` | Low |

**Fretboard Color Parameterization:**
```tsx
interface FretboardProps {
  // ... existing props
  colors?: {
    root: string;      // Default: #00ff00
    interval: string;  // Default: #3b82f6
    fret: string;      // Default: #1a1a1a
    string: string;    // Default: #888
  }
}
```

### Phase 2: Create Theme Tokens (0.5 days)

**Goal:** Define shared design vocabulary

```typescript
// themes/tokens.ts
export const tokens = {
  retro: {
    colors: {
      desktop: '#5698c3',
      window: '#c0c0c0',
      header: '#000080',
      root: '#00ff00',
      accent: '#ef4444'
    },
    fonts: {
      display: '"MS Sans Serif", sans-serif',
      mono: '"Courier New", monospace'
    },
    radii: { sm: '0px', md: '0px', lg: '0px' }
  },
  modern: {
    colors: {
      desktop: '#09090b',
      window: '#18181b',
      header: '#27272a',
      root: '#22c55e',
      accent: '#3b82f6'
    },
    fonts: {
      display: 'Inter, system-ui, sans-serif',
      mono: '"JetBrains Mono", monospace'
    },
    radii: { sm: '4px', md: '8px', lg: '16px' }
  }
};
```

### Phase 3: Build Modern UI Components (2-3 days)

**Goal:** Create shadcn/ui-based alternatives

| Retro Component | Modern Equivalent | Source |
|-----------------|-------------------|--------|
| `RetroWindow.tsx` | `Card.tsx` | shadcn/ui |
| `DesktopIcon.tsx` | `SidebarItem.tsx` | Custom |
| `InfoPanel.tsx` | `ControlBar.tsx` | Custom |
| Retro buttons | `Button.tsx` | shadcn/ui |
| Retro selects | `Select.tsx` | shadcn/ui |

**Install shadcn/ui:**
```bash
npx shadcn@latest init
npx shadcn@latest add button card select toggle-group
```

### Phase 4: Create Layout Wrappers (1 day)

**Goal:** Compose theme-specific layouts

```tsx
// components/layout/RetroLayout.tsx
export function RetroLayout({ children }) {
  return (
    <div className="retro-desktop">
      <DesktopIconSidebar />
      <RetroWindow title="Guitar Architect">
        {children}
      </RetroWindow>
    </div>
  );
}

// components/layout/ModernLayout.tsx
export function ModernLayout({ children }) {
  return (
    <div className="modern-shell">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

### Phase 5: Theme Context & Switching (0.5 days)

**Goal:** Enable runtime theme switching

```tsx
// context/ThemeContext.tsx
const ThemeContext = createContext<{
  theme: 'retro' | 'modern';
  setTheme: (t: 'retro' | 'modern') => void;
}>({ theme: 'retro', setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<'retro' | 'modern'>('retro');
  
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

---

## Component Mapping

| Feature | Retro | Modern |
|---------|-------|--------|
| App container | Desktop with icons | App shell with sidebar |
| Window chrome | 3D beveled borders | Rounded cards with shadows |
| Buttons | Raised/sunken effect | Flat with hover states |
| Selects | Native with border | Custom dropdown |
| Fretboard | Same component | Same component (different colors) |
| InfoPanel | Fixed top bar | Collapsible sidebar |

---

## CSS Strategy

**Option A: CSS Variables (Recommended)**
```css
/* globals.css */
:root {
  --color-bg: #5698c3;
  --color-surface: #c0c0c0;
  --radius: 0px;
}

[data-theme="modern"] {
  --color-bg: #09090b;
  --color-surface: #18181b;
  --radius: 8px;
}
```

**Option B: Separate CSS files**
```tsx
// Import based on theme
import '@/themes/retro.css';  // or
import '@/themes/modern.css';
```

---

## Testing Strategy

1. **Local toggle:** Add theme switch to dev toolbar
2. **URL param:** `?theme=modern` for testing
3. **A/B testing:** Feature flag with PostHog/LaunchDarkly
4. **User preference:** Save to localStorage or user settings

---

## Future Considerations

### Monorepo Migration (If Needed)
If themes diverge significantly or require separate deployments:

```
packages/
  @guitar-architect/core      ← Engine + headless components
  @guitar-architect/ui-retro  ← Retro theme package
  @guitar-architect/ui-modern ← Modern theme package

apps/
  retro/                      ← retro.guitararchitect.com
  modern/                     ← app.guitararchitect.com
```

### Additional Themes
The architecture supports adding more themes:
- Dark mode variants
- High contrast / accessibility
- Seasonal themes
- User-customizable themes

---

## Resources

- [shadcn/ui](https://ui.shadcn.com/) — Component library
- [Radix UI](https://www.radix-ui.com/) — Headless primitives
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Tailwind CSS Theming](https://tailwindcss.com/docs/customizing-colors)
