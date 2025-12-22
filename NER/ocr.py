import os
import json
import re
import fitz  # PyMuPDF
import cv2
import numpy as np
import tempfile
from PIL import Image
import easyocr
from dotenv import load_dotenv
import google.generativeai as genai

# ============================================================
# ENV + GEMINI SETUP
# ============================================================

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

gemini_model = genai.GenerativeModel(
    model_name="models/gemini-2.5-flash"
)

# ============================================================
# ENTITY SCHEMAS
# ============================================================

ENTITY_SCHEMAS = {
    "PAN Card": {
        "name": None,
        "father_name": None,
        "pan_number": None,
        "date_of_birth": None
    }
}

# ============================================================
# EASY OCR
# ============================================================

reader = easyocr.Reader(["en"], gpu=False)

# ============================================================
# PDF → IMAGES
# ============================================================

def pdf_to_images(file_stream, dpi=300):
    images = []

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(file_stream.read())
        pdf_path = tmp.name

    pdf = fitz.open(pdf_path)

    for page in pdf:
        pix = page.get_pixmap(dpi=dpi)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        images.append(img)

    pdf.close()
    os.remove(pdf_path)
    return images

# ============================================================
# DESKEW (SAFE)
# ============================================================

def deskew_pil_image(pil_img):
    img = np.array(pil_img)
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    _, thresh = cv2.threshold(
        gray, 0, 255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    coords = np.column_stack(np.where(thresh > 0))
    if len(coords) < 100:
        return img

    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = 90 + angle

    if abs(angle) > 10 or abs(angle) < 0.5:
        return img

    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)

    return cv2.warpAffine(
        img, M, (w, h),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE
    )

def ensure_name_field(entities: dict):
    """
    Guarantees that:
    - 'name' (lowercase) ALWAYS exists
    """
    if not isinstance(entities, dict):
        return entities

    name_value = None

    # Collect any possible name variants
    for key in list(entities.keys()):
        normalized_key = key.strip().lower().replace(" ", "_")

        if normalized_key == "name" or normalized_key == "full_name":
            if name_value is None and entities.get(key):
                name_value = entities[key]
            entities.pop(key)

    entities["name"] = name_value if name_value is not None else ""

    return entities

# ============================================================
# PREPROCESS
# ============================================================

def preprocess_image(pil_img):
    deskewed = deskew_pil_image(pil_img)
    return cv2.cvtColor(deskewed, cv2.COLOR_RGB2GRAY)

# ============================================================
# OCR WITH CONFIDENCE
# ============================================================

def run_easyocr(image_np):
    results = reader.readtext(image_np, detail=1, paragraph=False)
    return [
        {"text": t.strip(), "confidence": round(float(c), 3)}
        for _, t, c in results
    ]

# ============================================================
# CONFIDENCE
# ============================================================

def compute_page_confidence(lines):
    return round(sum(l["confidence"] for l in lines) / len(lines), 3) if lines else 0.0

def compute_document_confidence(pages):
    vals = [p["page_confidence"] for p in pages if p["page_confidence"] > 0]
    return round(sum(vals) / len(vals), 3) if vals else 0.0

# ============================================================
# OCR PIPELINE
# ============================================================

def process_pdf_with_easyocr(file_stream):
    pages = pdf_to_images(file_stream)
    output = []

    for i, img in enumerate(pages, start=1):
        processed = preprocess_image(img)
        lines = run_easyocr(processed)
        output.append({
            "page": i,
            "page_confidence": compute_page_confidence(lines),
            "content": lines
        })

    return output, pages  # return images also

# ============================================================
# JSON SAFETY
# ============================================================

def safe_json_parse(text):
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        return json.loads(match.group()) if match else {}

# ============================================================
# GEMINI — OCR TEXT PATH (HIGH CONF)
# ============================================================

def extract_entities_from_text(ocr_text, document_type):
    schema = ENTITY_SCHEMAS.get(document_type, {})

    prompt = f"""
You are extracting structured data from an official document.

IMPORTANT RULES:
- If the document contains fields like:
  "Student Name", "Candidate Name", "Applicant Name",
  "Name of the Student", "Name of Candidate"
  → they MUST be mapped to the field "name".
- The output MUST always contain "name".
- If no name is found, return "name" as an empty string.
- Do NOT create new keys.
- Do NOT return explanations.

Document type: {document_type}

Return STRICT JSON in this exact format:
{json.dumps(schema, indent=2)}

TEXT:
{ocr_text}
"""

    response = gemini_model.generate_content(
        prompt,
        generation_config={"temperature": 0.0}
    )

    return safe_json_parse(response.text)

# ============================================================
# GEMINI — FULL DOCUMENT (VISION) PATH (LOW CONF)
# ============================================================

def extract_entities_from_images(page_images, document_type):
    schema = ENTITY_SCHEMAS.get(document_type, {})

    prompt = f"""
You are given scanned official document images.

IMPORTANT RULES:
- If the document contains:
  "Student Name", "Candidate Name", "Applicant Name",
  "Name of the Student", "Name of Candidate"
  → they MUST be returned as "name".
- The output MUST always contain "name".
- If no name is visible, return "name" as an empty string.
- Give ALL RELEVANT FIELDS you can find. Do not skip any.
- Do NOT create new keys/values.

Document type: {document_type}

Return STRICT JSON in this exact format:
{json.dumps(schema, indent=2)}
"""

    contents = [prompt] + page_images

    response = gemini_model.generate_content(
        contents,
        generation_config={"temperature": 0.0}
    )

    return safe_json_parse(response.text)

# ============================================================
# FINAL ROUTER
# ============================================================

def process_pdf(file_stream, document_type, confidence_threshold=0.65):
    ocr_pages, page_images = process_pdf_with_easyocr(file_stream)
    doc_conf = compute_document_confidence(ocr_pages)

    if doc_conf >= confidence_threshold:
        text = "\n".join(
            line["text"]
            for page in ocr_pages
            for line in page["content"]
        )
        entities = extract_entities_from_text(text, document_type)
        source = "ocr"
    else:
        entities = extract_entities_from_images(page_images, document_type)
        source = "gemini_vision"

    entities = ensure_name_field(entities)

    return {
        "source": source,
        "document_type": document_type,
        "document_confidence": doc_conf,
        "extracted_entities": entities
    }
