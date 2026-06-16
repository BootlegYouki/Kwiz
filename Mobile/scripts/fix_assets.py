import os
import shutil
from PIL import Image

# Get the script's directory (E:\Github\tui-template-native\scripts)
scripts_dir = os.path.dirname(os.path.abspath(__file__))
# Get the root project directory (E:\Github\tui-template-native)
project_dir = os.path.dirname(scripts_dir)
assets_dir = os.path.join(project_dir, "assets")
icon_path = os.path.join(assets_dir, "icon.png")

# Check if iconpack folder exists inside assets/
iconpack_dir = os.path.join(assets_dir, "iconpack")
if os.path.exists(iconpack_dir):
    print(f"Iconpack folder found at {iconpack_dir}. Searching for base app icon...")
    base_icon_src = None
    
    # Prioritized search list
    for root, dirs, files in os.walk(iconpack_dir):
        if "AppIcon~ios-marketing.png" in files:
            base_icon_src = os.path.join(root, "AppIcon~ios-marketing.png")
            break
            
    if not base_icon_src:
        for root, dirs, files in os.walk(iconpack_dir):
            if "play_store_512.png" in files:
                base_icon_src = os.path.join(root, "play_store_512.png")
                break
                
    if not base_icon_src:
        for root, dirs, files in os.walk(iconpack_dir):
            if "icon.png" in files:
                if root != assets_dir:
                    base_icon_src = os.path.join(root, "icon.png")
                    break

    if base_icon_src:
        print(f"Extracted base icon: {base_icon_src} -> {icon_path}")
        shutil.copy(base_icon_src, icon_path)
        
        # Clean up the iconpack folder after successful extraction
        try:
            shutil.rmtree(iconpack_dir)
            print("Successfully cleaned up iconpack folder.")
        except Exception as e:
            print(f"Warning: Could not delete iconpack folder: {e}")
    else:
        print("Warning: Could not find any standard marketing or AppIcon source in the iconpack folder.")

# Load original full icon
if not os.path.exists(icon_path):
    print(f"Error: Base icon not found at {icon_path}")
    exit(1)

img = Image.open(icon_path).convert("RGB")
width, height = img.size

# Find bounding box of white logo
left, top, right, bottom = width, height, 0, 0
for y in range(height):
    for x in range(width):
        r, g, b = img.getpixel((x, y))
        if r > 15: # threshold
            if x < left: left = x
            if y < top: top = y
            if x > right: right = x
            if y > bottom: bottom = y

# Crop the logo
cropped_rgb = img.crop((left, top, right + 1, bottom + 1))
cw, ch = cropped_rgb.size

# Convert black background to transparency
# Each pixel becomes (255, 255, 255, intensity)
cropped_rgba = Image.new("RGBA", (cw, ch))
for y in range(ch):
    for x in range(cw):
        r, g, b = cropped_rgb.getpixel((x, y))
        intensity = int((r + g + b) / 3.0)
        cropped_rgba.putpixel((x, y), (255, 255, 255, intensity))

# Save a copy of this clean logo for scaling
clean_logo = cropped_rgba

# --- 1. Regenerate splash-icon.png and splash-icon-monochrome.png ---
logo_ratio = 0.75  # Logo occupies 75% of the canvas (matching BootHub)
max_dim = max(cw, ch)
splash_size = int(max_dim / logo_ratio)
splash_canvas = Image.new("RGBA", (splash_size, splash_size), (0, 0, 0, 0))
splash_paste_x = (splash_size - cw) // 2
splash_paste_y = (splash_size - ch) // 2
splash_canvas.paste(clean_logo, (splash_paste_x, splash_paste_y))

splash_canvas.save(os.path.join(assets_dir, "splash-icon.png"), "PNG")
splash_canvas.save(os.path.join(assets_dir, "splash-icon-monochrome.png"), "PNG")
print(f"Generated clean splash-icon.png and splash-icon-monochrome.png ({splash_size}x{splash_size})")

# --- 2. Regenerate adaptive-icon.png and adaptive-icon-monochrome.png ---
# Fit the logo inside a 152x152 area maintaining original aspect ratio (prevents squishing)
target_max_dim = 152
logo_aspect = cw / ch
if cw >= ch:
    target_logo_w = target_max_dim
    target_logo_h = int(target_max_dim / logo_aspect)
else:
    target_logo_h = target_max_dim
    target_logo_w = int(target_max_dim * logo_aspect)

# Resize clean logo to target size using high-quality resampling
clean_logo_resized = clean_logo.resize((target_logo_w, target_logo_h), Image.Resampling.LANCZOS)

adaptive_canvas = Image.new("RGBA", (432, 432), (0, 0, 0, 0))
adaptive_paste_x = (432 - target_logo_w) // 2
adaptive_paste_y = (432 - target_logo_h) // 2
adaptive_canvas.paste(clean_logo_resized, (adaptive_paste_x, adaptive_paste_y))

adaptive_canvas.save(os.path.join(assets_dir, "adaptive-icon.png"), "PNG")
adaptive_canvas.save(os.path.join(assets_dir, "adaptive-icon-monochrome.png"), "PNG")
print("Generated clean adaptive-icon.png and adaptive-icon-monochrome.png (432x432)")

# --- 3. Regenerate favicon.png ---
target_favicon_size = 192
favicon_logo_w = int(target_favicon_size * 0.8)
ratio = favicon_logo_w / cw
favicon_logo_h = int(ch * ratio)
if favicon_logo_h > target_favicon_size * 0.8:
    favicon_logo_h = int(target_favicon_size * 0.8)
    ratio = favicon_logo_h / ch
    favicon_logo_w = int(cw * ratio)

clean_favicon_resized = clean_logo.resize((favicon_logo_w, favicon_logo_h), Image.Resampling.LANCZOS)
favicon_canvas = Image.new("RGBA", (target_favicon_size, target_favicon_size), (0, 0, 0, 0))
favicon_paste_x = (target_favicon_size - favicon_logo_w) // 2
favicon_paste_y = (target_favicon_size - favicon_logo_h) // 2
favicon_canvas.paste(clean_favicon_resized, (favicon_paste_x, favicon_paste_y))
favicon_canvas.save(os.path.join(assets_dir, "favicon.png"), "PNG")
print("Generated clean favicon.png (192x192)")
