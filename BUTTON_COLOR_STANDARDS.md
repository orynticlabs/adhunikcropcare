# Storefront Button Color & Styling Standards

This document serves as the single source of truth for button colors, background colors, text colors, hover background colors, hover text colors, and icon hover behaviors across the entire **Adhunik Crop Care Storefront** website.

---

## 🎨 Brand Color Palette & Hex Tokens

| Color Name | Hex Code | Purpose in Design System |
| :--- | :--- | :--- |
| **Deep Forest Green** | `#033927` | Primary Brand Dark / Base Background for Primary Buttons |
| **Vibrant Leaf Green** | `#689c30` | Primary Brand Accent / Hover Background for Primary Buttons |
| **Golden Harvest Yellow** | `#e9c46a` | Secondary Accent / Promo Banners & CTAs |
| **Soft Mint Tint** | `#edf3e9` | Subdued Backgrounds / Pill Filters |
| **Light Neutral Border** | `#d7e0da` | Outlined Button & Card Borders |
| **Pure White** | `#ffffff` | Background for Outlined Buttons & Text on Primary Buttons |
| **Pure Black** | `#000000` | Text & Icon Color when Hovering Primary Dark Buttons |

---

## 🔘 Button Color Combinations Matrix (Normal vs. Hover)

### 1. Primary Solid Button (Main CTAs, Submit, Checkout, Primary Download)
- **Normal State (Without Hover)**:
  - **Background**: `#033927` (Deep Forest Green)
  - **Text Color**: `#ffffff` (Pure White)
  - **Border**: None
  - **Icon Color**: `#ffffff` (Pure White)
- **Hover State (With Hover)**:
  - **Background**: `#689c30` (Vibrant Leaf Green)
  - **Text Color**: `#000000` (Pure Black)
  - **Border**: None
  - **Icon Color**: `#000000` (Pure Black)
- **Tailwind Classes**:
  ```tsx
  className="bg-[#033927] text-white hover:bg-[#689c30] hover:text-black font-semibold transition-colors duration-200 cursor-pointer select-none shadow-xs"
  ```

---

### 2. Secondary Accent Button (Highlighted CTAs, Promos, Special Offers)
- **Normal State (Without Hover)**:
  - **Background**: `#689c30` (Vibrant Leaf Green)
  - **Text Color**: `#ffffff` (Pure White)
  - **Border**: None
  - **Icon Color**: `#ffffff` (Pure White)
- **Hover State (With Hover)**:
  - **Background**: `#033927` (Deep Forest Green)
  - **Text Color**: `#ffffff` (Pure White)
  - **Border**: None
  - **Icon Color**: `#ffffff` (Pure White)
- **Tailwind Classes**:
  ```tsx
  className="bg-[#689c30] text-white hover:bg-[#033927] hover:text-white font-semibold transition-colors duration-200 cursor-pointer select-none shadow-xs"
  ```

---

### 3. Outlined Neutral Button (Secondary actions, Cancel, Filters, Copy Link, Preview)
- **Normal State (Without Hover)**:
  - **Background**: `#ffffff` (Pure White)
  - **Text Color**: `#033927` (Deep Forest Green)
  - **Border**: `1px solid #d7e0da` (Light Neutral Border)
  - **Icon Color**: `#033927` (Deep Forest Green)
- **Hover State (With Hover)**:
  - **Background**: `#033927` (Deep Forest Green)
  - **Text Color**: `#ffffff` (Pure White)
  - **Border**: `1px solid #033927`
  - **Icon Color**: `#ffffff` (Pure White)
- **Tailwind Classes**:
  ```tsx
  className="bg-white text-[#033927] border border-[#d7e0da] hover:bg-[#033927] hover:text-white font-semibold transition-colors duration-200 cursor-pointer select-none shadow-xs"
  ```

---

### 4. Soft Mint Neutral Button (Pill Filters, Subdued Card Actions)
- **Normal State (Without Hover)**:
  - **Background**: `#edf3e9` (Soft Mint Tint)
  - **Text Color**: `#033927` (Deep Forest Green)
  - **Border**: `1px solid rgba(104, 156, 48, 0.2)`
  - **Icon Color**: `#033927` (Deep Forest Green)
- **Hover State (With Hover)**:
  - **Background**: `#033927` (Deep Forest Green)
  - **Text Color**: `#ffffff` (Pure White)
  - **Border**: `1px solid #033927`
  - **Icon Color**: `#ffffff` (Pure White)
- **Tailwind Classes**:
  ```tsx
  className="bg-[#edf3e9] text-[#033927] border border-[#689c30]/20 hover:bg-[#033927] hover:text-white font-semibold transition-colors duration-200 cursor-pointer select-none shadow-xs"
  ```

---

### 5. Harvest Yellow Accent Button (Promo Banners & Dynamic Highlights)
- **Normal State (Without Hover)**:
  - **Background**: `#e9c46a` (Golden Harvest Yellow)
  - **Text Color**: `#033927` (Deep Forest Green)
  - **Border**: None
  - **Icon Color**: `#033927` (Deep Forest Green)
- **Hover State (With Hover)**:
  - **Background**: `#033927` (Deep Forest Green)
  - **Text Color**: `#ffffff` (Pure White)
  - **Border**: None
  - **Icon Color**: `#ffffff` (Pure White)
- **Tailwind Classes**:
  ```tsx
  className="bg-[#e9c46a] text-[#033927] hover:bg-[#033927] hover:text-white font-bold transition-colors duration-200 cursor-pointer select-none shadow-md"
  ```

---

### 6. Icon Circle Button (Close X, Wishlist Heart, Quick Modal Actions)
- **Normal State (Without Hover)**:
  - **Background**: `#ffffff` (Pure White)
  - **Text Color**: `#033927` (Deep Forest Green)
  - **Border**: `1px solid #d7e0da`
  - **Icon Color**: `#033927` (Deep Forest Green)
- **Hover State (With Hover)**:
  - **Background**: `#033927` (Deep Forest Green)
  - **Text Color**: `#ffffff` (Pure White)
  - **Border**: `1px solid #033927`
  - **Icon Color**: `#ffffff` (Pure White)
- **Tailwind Classes**:
  ```tsx
  className="bg-white text-[#033927] border border-[#d7e0da] hover:bg-[#033927] hover:text-white transition-colors duration-200 rounded-full cursor-pointer select-none shadow-xs"
  ```

---

## 🔒 Mandatory Requirements for AI Agents & Developers

1. **High-Contrast Text & Icon Guarantee**: When hovering over a dark green button (`bg-[#033927]`), the background changes to vibrant green (`#689c30`) and text/icons MUST turn black (`hover:text-black`) to ensure maximum readability.
2. **Smooth Transitions**: Always include `transition-colors duration-200` on interactive elements.
3. **Cursor Pointer & Text Selection**: Always include `cursor-pointer select-none` on clickable buttons and pills.
