from PIL import Image
import pytesseract
import re
import os

# ✅ Ensure pytesseract can find the executable (Windows-specific)
# You can change this path if Tesseract is installed elsewhere.
TES_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(TES_PATH):
    pytesseract.pytesseract.tesseract_cmd = TES_PATH
else:
    print("⚠️ Warning: Tesseract executable not found at", TES_PATH)
    print("   Please verify that Tesseract is installed correctly.")

# ---------- OCR Conversion ----------
def image_to_text(image_path):
    """
    Extract text from an image using Tesseract OCR.
    """
    try:
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img, lang='eng')
        return text
    except Exception as e:
        print("❌ OCR Error:", e)
        return ""

# ---------- Line & Price Extraction ----------
PRICE_RE = re.compile(r'([A-Za-z0-9 &\-\(\)\.\/]+?)\s+([0-9]+(?:\.[0-9]{1,2})?)$')

def extract_lines_with_prices(raw_text):
    """
    Extracts lines containing item descriptions and prices.
    Example: "Pizza Large 250.00" → {"description": "Pizza Large", "price": 250.00}
    """
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    items = []
    for ln in lines:
        m = PRICE_RE.search(ln)
        if m:
            desc = m.group(1).strip()
            try:
                price = float(m.group(2))
            except ValueError:
                continue
            items.append({'description': desc, 'price': price, 'raw_line': ln})
    return items
