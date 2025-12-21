# dbms lab project - automated KYC document processing API

from flask import Flask, jsonify, request
from flask_cors import CORS
from io import BytesIO

# ✅ IMPORT FROM ocr.py
from ocr import process_pdf

app = Flask(__name__)
CORS(app)


@app.route('/', methods=['GET'])
def test():
    return jsonify({"message": "Flask server is running"}), 200


@app.route('/uploadDetails', methods=['POST'])
def upload_details():
    try:
        files = request.files.getlist("file")
        document_types = request.form.getlist("document_type")

        if not files:
            return jsonify({"error": "No files uploaded."}), 400

        if len(files) != len(document_types):
            return jsonify({
                "error": "Each file must have a corresponding document_type"
            }), 400

        extracted_entities_list = []

        for idx, file in enumerate(files):
            file_stream = BytesIO(file.read())

            # ✅ Document type bound PER FILE
            document_type = document_types[idx]

            result = process_pdf(
                file_stream=file_stream,
                document_type=document_type,
                confidence_threshold=0.70
            )

            if not result or "extracted_entities" not in result:
                return jsonify({
                    "error": f"Failed to extract entities from {file.filename}"
                }), 500

            entities = result["extracted_entities"]

            # ✅ Inject correct document_type
            entities["document_type"] = document_type

            extracted_entities_list.append(entities)

        return jsonify({
            "extracted_entities": extracted_entities_list
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
