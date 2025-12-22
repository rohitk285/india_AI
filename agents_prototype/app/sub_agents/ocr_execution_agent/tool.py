import easyocr
import os

# Initialize EasyOCR once (English only)
reader = easyocr.Reader(["en"], gpu=False)


from google.adk.tools import ToolContext

def execute_ocr_pipeline(tool_context: ToolContext):
    """
    Retrieves 'preprocessed_image_paths' from state, runs EasyOCR on each,
    computes confidence scores, and stores 'ocr_results' in state.
    """
    image_paths = tool_context.state.get("preprocessed_image_paths", [])
    if not image_paths:
        return "No image paths found in state['preprocessed_image_paths']."

    pipeline_results = {
        "pages": [],
        "doc_confidence": 0.0
    }

    import cv2 

    for idx, path in enumerate(image_paths):
        if not os.path.exists(path):
            continue

        # Load image (grayscale)
        img_np = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
        if img_np is None:
            continue

        # Run EasyOCR
        # detail=1 returns (bbox, text, confidence)
        raw_output = reader.readtext(img_np, detail=1, paragraph=False)
        
        lines = []
        for _, text, conf in raw_output:
            lines.append({
                "text": text.strip(),
                "confidence": round(float(conf), 3)
            })

        # Page Stats
        page_conf = compute_page_confidence(lines)
        
        pipeline_results["pages"].append({
            "page_index": idx,
            "content": lines,
            "page_confidence": page_conf
        })

    # Document Stats
    pipeline_results["doc_confidence"] = compute_document_confidence(pipeline_results["pages"])

    tool_context.state["ocr_results"] = pipeline_results
    
    return (
        f"Processed {len(pipeline_results['pages'])} pages. "
        f"Document Confidence: {pipeline_results['doc_confidence']}. "
        "Results stored in state['ocr_results']."
    )


def compute_page_confidence(ocr_lines):
    """
    Average confidence of OCR lines on a page.
    """
    if not ocr_lines:
        return 0.0

    return round(
        sum(l["confidence"] for l in ocr_lines) / len(ocr_lines),
        3
    )


def compute_document_confidence(pages):
    """
    Average confidence across pages.
    """
    vals = [
        p["page_confidence"]
        for p in pages
        if p["page_confidence"] > 0
    ]

    return round(sum(vals) / len(vals), 3) if vals else 0.0
