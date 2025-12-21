from ocr import process_pdf
import json

with open("test_data/sample2.pdf", "rb") as f:
    result = process_pdf(
        file_stream=f,
        document_type="Driving license",
        confidence_threshold=0.40
    )

print(json.dumps(result, indent=2))
