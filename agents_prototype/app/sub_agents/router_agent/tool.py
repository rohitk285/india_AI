import os
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


from google.adk.tools import ToolContext
import json

def process_document_routing(tool_context: ToolContext):
    """
    Decides whether to return raw OCR or refine with Gemini based on confidence.
    Reads 'ocr_results' from state.
    """
    try:
        ocr_results = tool_context.state["ocr_results"]
    except KeyError:
        return "No OCR results found in state."
    if not ocr_results:
        return "No OCR results found in state."

    # If ocr_results is a string, it means previous step failed or returned a message instead of dict
    if isinstance(ocr_results, str):
        return f"Cannot process routing. OCR results is a string: {ocr_results[:200]}"

    # Access dictionary keys directly or handle potential proxy nuances
    # Assuming ocr_results is a standard dict, but to be safe:
    try:
        if isinstance(ocr_results, dict):
             doc_confidence = ocr_results.get("doc_confidence", 0.0)
        else:
             doc_confidence = getattr(ocr_results, "doc_confidence", 0.0)
    except Exception as e:
        return f"Error accessing doc_confidence: {e}"
    
    # Logic: High confidence -> Return valid raw text
    if doc_confidence >= 0.70:
        pages = ocr_results.get("pages", []) if isinstance(ocr_results, dict) else ocr_results.pages
        combined_text = "\n".join(
            line["text"] 
            for page in pages
            for line in (page["content"] if isinstance(page, dict) else page.content)
            if (line["text"] if isinstance(line, dict) else line.text)
        )
        return f"High confidence ({doc_confidence}). Returning raw OCR text.\n\nTEXT:\n{combined_text[:500]}..."

    # Logic: Low confidence -> Gemini Refinement
    else:
        pages = ocr_results.get("pages", []) if isinstance(ocr_results, dict) else ocr_results.pages
        combined_text = "\n".join(
            line["text"]
            for page in pages
            for line in (page["content"] if isinstance(page, dict) else page.content)
            if (line["text"] if isinstance(line, dict) else line.text)
        )
        
        # Call Gemini (internal helper)
        refined_output = _call_gemini_refinement(combined_text)
        return f"Low confidence ({doc_confidence}). Text refined by Gemini.\n\nOUTPUT:\n{refined_output}"


def _call_gemini_refinement(raw_text):
    prompt = f"""
    You are an AI document understanding engine.
    The OCR confidence is LOW. Clean and structured the following text:
    
    TEXT:
    {raw_text[:4000]}  # Truncate to avoid context limit in this basic demo
    """
    
    try:
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Gemini Error: {e}"
