import os
import random
from PIL import Image

# -------- config --------
input_dir = "example_images_original"
output_dir = "example_images"
output_size = 64
extensions = (".png", ".jpg", ".jpeg")
# ------------------------

os.makedirs(output_dir, exist_ok=True)

# collect image paths
image_paths = [
    os.path.join(input_dir, f)
    for f in os.listdir(input_dir)
    if f.lower().endswith(extensions)
]

# randomize order
random.shuffle(image_paths)

def center_crop(img):
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    right = left + side
    bottom = top + side
    return img.crop((left, top, right, bottom))

for idx, img_path in enumerate(image_paths):
    with Image.open(img_path) as img:
        img = img.convert("RGB")           # safe for jpg/png mix
        img = center_crop(img)
        img = img.resize((output_size, output_size), Image.BICUBIC)

        out_path = os.path.join(output_dir, f"{idx}.png")
        img.save(out_path)

print(f"Processed {len(image_paths)} images.")
