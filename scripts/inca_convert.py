# One-off: convert the Inca Trail HEIC captures into web-friendly webp.
# Full-size (max 2000px) -> public/inca/photos, plus 640px thumbs for review.
import os
from PIL import Image, ImageOps
import pillow_heif

pillow_heif.register_heif_opener()

SRC = r"C:\Users\boris\Downloads"
OUT = r"C:\Users\boris\Documents\code\website\public\inca\photos"
THUMBS = r"C:\Users\boris\AppData\Local\Temp\inca_thumbs"

names = [
    "IMG_6603","IMG_6608","IMG_6609","IMG_6617","IMG_6618","IMG_6619",
    "IMG_6630","IMG_6631","IMG_6632","IMG_6681","IMG_6682","IMG_6683",
    "IMG_6684","IMG_6685","IMG_6686","IMG_6687","IMG_6688","IMG_6689",
    "IMG_6693","IMG_6699","IMG_6709","IMG_6717",
]

os.makedirs(OUT, exist_ok=True)
os.makedirs(THUMBS, exist_ok=True)

def fit(img, maxpx):
    w, h = img.size
    scale = min(maxpx / w, maxpx / h, 1.0)
    if scale < 1.0:
        img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    return img

for name in names:
    src = os.path.join(SRC, name + ".HEIC")
    if not os.path.exists(src):
        print("MISSING", name); continue
    try:
        img = Image.open(src)
        img = ImageOps.exif_transpose(img).convert("RGB")  # honor orientation
        fit(img, 2000).save(os.path.join(OUT, name + ".webp"), "WEBP", quality=82, method=6)
        fit(img.copy(), 640).save(os.path.join(THUMBS, name + ".webp"), "WEBP", quality=70, method=4)
        print("OK", name, img.size)
    except Exception as e:
        print("FAIL", name, repr(e))
print("done")
