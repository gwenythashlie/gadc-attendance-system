# Logo Placeholder Guide

## 📸 How to Add Your Logo

The system currently has a placeholder emoji (🎓) for the logo. To add your actual logo:

### Step 1: Prepare Your Logo

1. **File format**: PNG or SVG recommended for best quality
2. **Size**: 200x200px minimum (square format works best)
3. **Background**: Transparent or solid color
4. **File name**: `logo.png` or `logo.svg`

### Step 2: Add Logo to Project

**Option A: Using Base64 (Embedded)**
1. Convert your logo to base64: https://base64.guru/converter/encode/image
2. Open `frontend/index.html`
3. Find line with `id="logoPlaceholder"`
4. Replace with:
```html
<img src="data:image/png;base64,YOUR_BASE64_HERE" class="logo-image" alt="Logo">
```

**Option B: Using File (Recommended)**
1. Save your logo as `frontend/logo.png`
2. Open `frontend/index.html`
3. Find line with `id="logoPlaceholder"`
4. Replace with:
```html
<img src="logo.png" class="logo-image" alt="Logo">
```

### Step 3: Update Favicon (Optional)

To use your logo as the browser tab icon:

1. Create a 32x32px version of your logo
2. Save as `frontend/favicon.ico` or `frontend/favicon.png`
3. In `frontend/index.html`, find the `<link rel="icon"` tag
4. Replace with:
```html
<link rel="icon" type="image/png" href="favicon.png">
```

## 🎨 Current Styling

The logo is styled with:
- Width: 50px
- Height: 50px
- Border radius: 8px (rounded corners)
- Gradient background (if using placeholder)

You can adjust these in the `.logo-image` CSS class.

## 💡 Tips

- **High resolution**: Use @2x images for retina displays
- **SVG format**: Scales perfectly at any size
- **Fallback**: Keep the emoji placeholder in case image fails to load
- **Branding**: Match your logo colors with the gradient theme

---

**Current Placeholder**: 🎓 (Graduation cap emoji)
**Recommended Size**: 200x200px
**Format**: PNG, SVG, or Base64
