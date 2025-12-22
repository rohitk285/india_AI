import os
import base64
from io import BytesIO
from PIL import Image
import pypdfium2 as pdfium
from google.adk.tools import ToolContext


def pdf_to_images(
    file_path: str,
    tool_context: ToolContext,
    dpi: int = 300,
    max_pages: int = 20,
):
    """
    Convert a PDF into images and RETURN them in a serializable form.

    Returns:
        List[dict]: Each dict represents one page image.
    """

    if not os.path.exists(file_path):
        return {
            "error": f"File not found at '{file_path}'"
        }

    results = []

    try:
        pdf = pdfium.PdfDocument(file_path)
        page_count = min(len(pdf), max_pages)
        scale = dpi / 72

        for idx in range(page_count):
            page = pdf[idx]
            bitmap = page.render(scale=scale)
            image = bitmap.to_pil().convert("RGB")

            buffer = BytesIO()
            image.save(buffer, format="PNG")
            buffer.seek(0)

            image_b64 = base64.b64encode(buffer.read()).decode("utf-8")

            results.append({
                "page_index": idx,
                "width": image.width,
                "height": image.height,
                "mode": image.mode,
                "image_base64": image_b64,
            })

        tool_context.state["images"] = results

        return results

    except Exception as e:
        return {
            "error": str(e)
        }
