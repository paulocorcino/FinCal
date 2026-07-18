---
name: FinCal AI Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45474c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#330009'
  on-tertiary: '#ffffff'
  tertiary-container: '#590016'
  on-tertiary-container: '#ff4e69'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  container-padding: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  desktop-max-width: 1440px
---

## Brand & Style

The design system is engineered to project **predictability, intelligence, and institutional trust**. It targets professionals and high-intent users who require clarity in financial forecasting. 

The aesthetic follows a **Corporate / Modern** style with high-precision execution. It prioritizes data density without sacrificing airiness, using generous whitespace to reduce cognitive load. The UI relies on a systematic approach to information hierarchy, ensuring that the AI-driven insights feel grounded and reliable rather than experimental. Visual metaphors are rooted in stability and growth, utilizing a clean, structural grid that mirrors the organized nature of financial ledgers.

## Colors

The palette is anchored by **Navy (#1E293B)**, representing the "Foundational Trust" of the system. This color is used for primary navigation, high-level headers, and core brand moments. 

**Functional Accents:**
- **Growth (Emerald #10B981):** Reserved for positive financial indicators, income, and primary success actions.
- **Expense (Rose #F43F5E):** Used for outflows, negative balances, and critical warnings.
- **Neutral (Slate #F8FAFC / #E2E8F0):** These tones form the architectural skeleton, used for subtle backgrounds and structural dividers to ensure the interface feels expansive and clean.

Color should be used functionally to denote "State" rather than decoration. AI-driven components may utilize a subtle gradient blending Navy and Emerald to represent the "Intelligence" layer.

## Typography

This design system utilizes **Geist** for headlines and labels to leverage its technical, precise character, while **Inter** is used for body text to ensure maximum readability in data-heavy contexts.

**Numerical Legibility:** 
All financial figures, tables, and balance readouts must use **Tabular Figures** (`font-variant-numeric: tabular-nums`). This ensures that decimal points align vertically in lists, which is critical for financial comparison. 

**Scale Strategy:**
Headlines use tight letter spacing and heavier weights to feel authoritative. Labels for data points and status badges utilize a slightly increased letter spacing and uppercase styling for clarity at small sizes.

## Layout & Spacing

The system employs a **12-column fluid grid** for desktop and a **single-column fluid layout** for mobile. 

**Key Layout Rules:**
- **Rhythm:** A 4px base unit governs all spacing. Vertical stacks of content should use 16px (md) or 32px (lg) increments to maintain a rigorous professional rhythm.
- **Margins:** Desktop views utilize a 24px outer margin. On mobile, margins reduce to 16px to maximize screen real estate for data tables.
- **Dashboards:** Use a "Fixed Sidebar / Fluid Content" model. The sidebar remains at a constant 280px width, while the data panels expand to fill the viewport, capped at 1440px for optimal line length and readability.

## Elevation & Depth

Depth is used sparingly to denote interactivity and information hierarchy. 

**Tonal Layering:** 
Primary surfaces are white (#FFFFFF) set against a light slate background (#F8FAFC). This creates a "Natural Elevation" without the need for heavy shadows. 

**Ambient Shadows:**
When depth is required (e.g., for cards or dropdowns), use extra-diffused, low-opacity shadows. 
- **Shadow Style:** `0px 4px 20px rgba(30, 41, 59, 0.05)`. 
- The shadow color is tinted with the Primary Navy to ensure it feels integrated with the UI rather than a generic gray.

**Interactive States:**
Buttons and interactive cards should "lift" slightly on hover by increasing the shadow spread and decreasing its opacity, simulating a physical approach.

## Shapes

The shape language is **Rounded**, strike a balance between friendly modernism and professional structure. 

- **Base Components:** Buttons and inputs use a `0.5rem` (8px) radius. 
- **Data Containers:** Cards and large panels use `rounded-lg` (16px) to frame content softly. 
- **Feedback Elements:** Status badges and "Pill" buttons use `rounded-xl` or full round for a distinct visual separation from the structural grid.

Avoid sharp 0px corners, as they can feel overly aggressive for a tool intended to provide financial peace of mind.

## Components

**Buttons:**
- **Primary ('Novo Lançamento'):** Solid Navy background with white text. High contrast for primary funnel entry points.
- **Action ('Assistente'):** Emerald background to signify growth and intelligence-driven interaction.
- **Secondary:** Transparent with a Slate #E2E8F0 border.

**Status Badges:**
- **PENDENTE:** Soft Amber background with dark slate text. The lower contrast indicates a "waiting" state.
- **EFETIVADO:** Solid Emerald or Primary Navy background with white text, signaling completion and permanence.

**Input Fields:**
- Borders must be #E2E8F0. On focus, the border transitions to Primary Navy with a 2px outer glow of Emerald (at 10% opacity) to signify the "active intelligence" of the field.

**Cards:**
- White background, 16px rounded corners, and a subtle 1px border (#E2E8F0). The card header should have a light slate background-bottom-border to separate summary stats from detail rows.

**Graphs & Charts:**
- Use the **Growth Emerald** for actual income and **Primary Navy** for projected lines. For expense categories, use the **Rose** palette. All chart axes and labels must use the `label-sm` typography role in Slate #64748B.