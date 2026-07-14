---
name: Radical Luxury
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c9c6c5'
  secondary: '#5f5f57'
  on-secondary: '#ffffff'
  secondary-container: '#e5e3d9'
  on-secondary-container: '#65655d'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1d00'
  on-tertiary-container: '#868900'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c9c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#e5e3d9'
  secondary-fixed-dim: '#c8c7be'
  on-secondary-fixed: '#1c1c16'
  on-secondary-fixed-variant: '#474740'
  tertiary-fixed: '#e7eb28'
  tertiary-fixed-dim: '#cace00'
  on-tertiary-fixed: '#1c1d00'
  on-tertiary-fixed-variant: '#484a00'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  warm-bone: '#F9F8F6'
  soft-grey: '#E5E5E5'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 64px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Libre Caslon Text
    fontSize: 40px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: 0.05em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.1em
  utility-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  section-gap: 120px
---

## Brand & Style
This design system embodies "Radical Luxury"—a philosophy that merges clinical precision with high-fashion editorial aesthetics. The brand personality is authoritative yet ethereal, catering to a sophisticated audience that values transparency and "clean beauty" without sacrificing prestige. 

The visual style is **Minimalist and Architectural**, characterized by heavy whitespace, a strictly disciplined monochromatic foundation, and sharp, uncompromising edges. It avoids decorative flourishes, allowing the product's narrative and high-quality photography to serve as the primary visual texture. The emotional response is one of calm, intellectual curiosity and premium reliability.

## Colors
The palette is a high-contrast study in neutrals. **Deep Black** is used for all structural elements, primary text, and core CTAs to provide a grounded, authoritative weight. **White** and **Warm Bone** serve as the expansive canvas, ensuring the UI feels airy and spacious. 

**Earthy Beige** is used for secondary metadata and disabled states, echoing the natural ingredients of the product line. A singular **Acidic Lime** is reserved for high-impact accents or specific product-state callouts, providing a modern, biotechnological "spark" within the otherwise organic palette. Color is used sparingly; hierarchy is primarily established through scale and typography rather than hue.

## Typography
Typography is the most critical element of this design system. It utilizes a sophisticated "triptych" of styles:
- **Serif (Libre Caslon Text):** Used for large editorial headlines and brand storytelling. It evokes heritage, luxury, and a literary quality.
- **Sans-Serif (Hanken Grotesk):** Used for body copy and product names. Its clean, contemporary geometry ensures readability and a modern "clean beauty" feel.
- **Monospace (JetBrains Mono):** Used for utility labels, categories (e.g., "EAU DE PARFUM"), and technical data. This injects a clinical, "lab-verified" aesthetic that balances the softness of the serif.

**Text Transformation:** Use Uppercase and generous letter-spacing for monospace labels to create a "specimen tag" effect.

## Layout & Spacing
The layout follows a **Fixed Grid** model with an emphasis on "Discovery." 

- **Desktop:** A 12-column grid with generous 64px outer margins. Vertical spacing between major sections is aggressive (120px+) to ensure each product story has room to breathe.
- **Mobile:** A 2-column or 4-column grid with 20px margins. 
- **Rhythm:** Elements within a product block (Image, Title, Description, Price) use tight vertical spacing (8px-12px) to group information, while the space between product blocks is large (48px+) to prevent visual clutter. 

The "Cart Drawer" and "Quick Add" interfaces utilize a more condensed version of this rhythm to emphasize utility and conversion.

## Elevation & Depth
This design system rejects shadows and blurs in favor of **Flat Tonal Layering** and **Bold Outlines**. 

- **Flatness:** Surfaces are opaque. Depth is created through the stacking of high-contrast containers (e.g., a black button on a white background).
- **Outlines:** Use 1px solid borders for interactive elements like input fields, size selectors, and secondary buttons. These borders should be `#030303`.
- **Dividers:** Horizontal hair-lines (1px) are used to separate global sections like the header, footer, and announcement bar. 
- **Z-Index:** The only use of "depth" is for functional overlays like the cart drawer, which should slide over the content with a sharp, no-shadow transition.

## Shapes
The shape language is strictly **Sharp (0px)**. All containers, buttons, images, and input fields must have squared corners. This reinforces the architectural, laboratory-inspired precision of the brand and differentiates it from more "organic" or "soft" competitors in the beauty space.

## Components

### Buttons
- **Primary:** Solid black background, white uppercase text (Monospace), sharp corners. High horizontal padding.
- **Secondary:** 1px black border, transparent background, black text.
- **Quick Add:** Built into product grids; shifts from secondary to primary state on hover.

### Inputs & Selectors
- **Input Fields:** 1px black border bottom or full box. No background. Labels use the `label-caps` style.
- **Size Selectors:** Square tiles with 1px borders. The active state flips to a black background with white text.

### Cards
- **Product Card:** Image-first. Typography is stacked below: Category (Mono), Name (Sans-Bold), Price (Mono). All elements are left-aligned or center-aligned based on the specific page context, but never mixed.

### Status & Feedback
- **Shipping Motivator:** A thin bar above the cart drawer using the `utility-mono` font.
- **Loading States:** Text-based updates (e.g., "ADDING...") rather than spinners to maintain the minimalist aesthetic.

### Iconography
- Icons must use thin-stroke weights (1px) that match the typography's line weight. Use minimal, geometric glyphs for social media and navigation.