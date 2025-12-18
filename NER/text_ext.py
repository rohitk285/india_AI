import os
import json
import base64
import fitz
import requests
import tempfile
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = os.getenv("GEMINI_API_URL")

getDescriptionPrompt = """You are tasked with extracting and classifying the document type from the provided image and outputting only the named entities in strict JSON format. Follow these rules strictly:
1. Always include the document_type field with an exact and consistent value for the same type of document (e.g., "PAN Card" for all PAN cards).
2. Extract all named entities relevant to the document type, and include them under the named_entities field in a key-value format.
3. Do not add any commentary, explanation, or additional text outside of the JSON.
4. Ensure the JSON response follows this exact structure:

[
  {
    "document_type": "<document_type>",
    "named_entities": {
      "<entity_1>": "<value_1>",
      "<entity_2>": "<value_2>",
      ...
    }
  }
]

Here are examples for different document types to guide your output:

### PAN Card
[
  {
    "document_type": "PAN Card",
    "named_entities": {
      "Name": "Ram Agya Prasad",
      "Date of Birth": "24/01/1991",
      "Permanent Account Number": "CXRPK9829B",
      "Address": "House No. 123, Sector 9, Gurgaon, Haryana - 122001"
    }
  }
]

### Aadhaar Card
[
  {
    "document_type": "Aadhaar Card",
    "named_entities": {
      "Name": "Sita Ram Gupta",
      "Aadhaar Number": "1234 5678 9123",
      "Date of Birth": "15/06/1985",
      "Gender": "Male",
      "Address": "House No. 123, Sector 9, Gurgaon, Haryana - 122001"
    }
  }
]

### Credit Card
[
  {
    "document_type": "Credit Card",
    "named_entities": {
      "Name": "John A. Smith",
      "Card Number": "4111 1111 1111 1111",
      "Expiry Date": "12/26",
      "Bank Name": "XYZ Bank"
    }
  }
]

### Cheque
[
  {
    "document_type": "Cheque",
    "named_entities": {
      "Name": "Rajesh Kumar",
      "Account Number": "9876543210",
      "Bank Name": "ABC Bank",
      "IFSC Code": "ABCD0123456",
      "Cheque Number": "123456",
      "Amount": "₹10,000"
    }
  }
]

### Driving License
[
    {
        "document_type": "Driving License",
        "named_entities": {
            "Name": "Amit Sharma",
            "License Number": "DL-0420110149646",
            "Date of Birth": "10/10/1990",
            "Address": "House No. 456, Sector 10, Gurgaon, Haryana - 122001",
            "Issue Date": "15/08/2020",
            "Expiry Date": "14/08/2030",
            "Blood Group": "O+"
        }
    }
]

### Passport
[
    {
        "document_type": "Passport",
        "named_entities": {
            "Name": "Amit Sharma",
            "Passport Number": "N1234567",
            "Date of Birth": "10/10/1990",
            "Address": "House No. 456, Sector 10, Gurgaon, Haryana - 122001",
            "Gender": "Male",
            "Nationality": "Indian",
            "Issue Date": "15/08/2020",
            "Expiry Date": "14/08/2030",
            "Place of Issue": "Delhi"
        }
    }
]

For every receipt or document, generate the response in the same format and structure, maintaining consistency for the document_type field. Always ensure the JSON format is valid.
Important: Do NOT include any fields that are not listed in the examples above. Only output keys exactly matching those shown."""

def pdf_to_images(file_stream, max_images=10):
    image_buffers = []

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_pdf:
        temp_pdf.write(file_stream.read())
        temp_pdf_path = temp_pdf.name

    pdf_document = fitz.open(temp_pdf_path)
    for page_num in range(min(len(pdf_document), max_images)):
        page = pdf_document[page_num]
        pix = page.get_pixmap(dpi=300)

        img_buffer = BytesIO()
        img_buffer.name = f"page_{page_num + 1}.png"
        img_buffer.write(pix.tobytes("png"))
        img_buffer.seek(0)
        image_buffers.append(img_buffer)

    pdf_document.close()
    os.remove(temp_pdf_path)
    return image_buffers

def base64_encode_image(image_bytesio):
    buffered = BytesIO()
    image = Image.open(image_bytesio)
    image.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def call_gemini_api(prompt, base64_image):
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/png",
                            "data": base64_image
                        }
                    }
                ]
            }
        ]
    }

    response = requests.post(
        f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
        headers=headers,
        json=payload
    )

    if response.status_code == 200:
        candidates = response.json().get("candidates", [])
        if candidates:
            print("Raw Gemini Response:", json.dumps(response.json(), indent=2))
            return candidates[0]["content"]["parts"][0]["text"]
    else:
        print("Gemini API Error:", response.text)
    return None

def convert_to_strict_json(response_content):
    try:
        response_content = response_content.strip()
        start_idx = response_content.find("[")
        end_idx = response_content.rfind("]") + 1
        if start_idx != -1 and end_idx != -1:
            return json.loads(response_content[start_idx:end_idx])
        else:
            print("Error: JSON boundaries not found.")
            return []
    except json.JSONDecodeError:
        print("Error decoding JSON.")
        return []

def normalize_json_response(parsed_response):
    normalized = []

    # Fields expected per document type
    expected_fields_by_type = {
        "PAN Card": [
            "Name",
            "Date of Birth",
            "Permanent Account Number",
            "Address"  # include if you want to prefix
        ],
        "Aadhaar Card": [
            "Name",
            "Aadhaar Number",
            "Date of Birth",
            "Gender",
            "Address"
        ],
        "Credit Card": [
            "Name",
            "Card Number",
            "Expiry Date",
            "Bank Name"
        ],
        "Cheque": [
            "Name",
            "Account Number",
            "Bank Name",
            "IFSC Code",
            "Cheque Number",
            "Amount"
        ],
        "Driving License": [
            "Name",
            "License Number",
            "Date of Birth",
            "Address",
            "Issue Date",
            "Expiry Date",
            "Blood Group"
        ],
        "Passport": [
            "Name",
            "Passport Number",
            "Date of Birth",
            "Address",
            "Gender",
            "Nationality",
            "Issue Date",
            "Expiry Date",
            "Place of Issue"
        ]
    }

    for entry in parsed_response:
        document_type = entry.get("document_type", "")
        named_entities = entry.get("named_entities", {})

        if not isinstance(named_entities, dict):
            named_entities = {}

        # Filter only expected fields
        filtered_entities = {}
        if document_type in expected_fields_by_type:
            allowed_keys = expected_fields_by_type[document_type]
            for key in allowed_keys:
                if key in named_entities:
                    # Prefix Address with document type
                    if key.lower() == "address":
                        filtered_entities[f"{document_type} {key}"] = named_entities[key]
                    else:
                        filtered_entities[key] = named_entities[key]

        normalized_entry = {
            "document_type": document_type,
            "named_entities": filtered_entities
        }

        normalized.append(normalized_entry)

    return normalized

def process_file_with_gemini(file_stream, filename, json_output_path=None):
    """
    Process either a PDF or an image file using Gemini API and extract entities.
    """
    extension = filename.lower().split(".")[-1]
    all_responses = []
    valid_document_types = ["Aadhaar Card", "PAN Card", "Cheque", "Credit Card", "Driving License", "Passport"]

    images = []
    
    if extension == "pdf":
        print("Detected PDF file. Converting pages to images...")
        images = pdf_to_images(file_stream)

    elif extension in ["jpg", "jpeg", "png"]:
        print("Detected image file. Preparing for Gemini API...")
    
        image = Image.open(file_stream).convert("RGB")
        img_buffer = BytesIO()
        image.save(img_buffer, format="PNG")
        img_buffer.seek(0)
        images = [img_buffer]

    else:
        print("Unsupported file format. Please upload PDF, JPG, JPEG, or PNG.")
        return []

    for idx, image_io in enumerate(images):
        print(f"Processing image {idx + 1}/{len(images)}")

        base64_image = base64_encode_image(image_io)
        raw_response = call_gemini_api(getDescriptionPrompt, base64_image)
        if not raw_response:
            continue

        parsed = convert_to_strict_json(raw_response)
        normalized = normalize_json_response(parsed)

        for entry in normalized:
            doc_type = entry.get("document_type", "")
            named = entry.get("named_entities", {})
            if doc_type == "Aadhaar Card" and "Aadhaar Number" not in named:
                continue
            if doc_type == "PAN Card" and "Permanent Account Number" not in named:
                continue
            if doc_type in valid_document_types:
                all_responses.append(entry)
                break

    if json_output_path:
        with open(json_output_path, "w") as f:
            json.dump(all_responses, f, indent=4)

    return all_responses
