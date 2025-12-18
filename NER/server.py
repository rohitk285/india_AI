# dbms lab project - automated KYC document processing API

from flask import Flask, jsonify, request
from flask_cors import CORS
from io import BytesIO
from text_ext import process_file_with_gemini

app = Flask(__name__)
CORS(app)


@app.route('/', methods=['GET'])
def test():
    return jsonify({"message": "Flask server is running"}), 200


@app.route('/uploadDetails', methods=['POST'])
def upload_details():
    try:
        files = request.files
        if not files:
            return jsonify({"error": "No files uploaded."}), 400

        document_outputs = []

        for file_key, file in files.items():
            # Read file content in memory
            file_stream = BytesIO(file.read())

            # Process file
            document_data = process_file_with_gemini(file_stream, file.filename)
            if not document_data:
                return jsonify({"error": f"Failed to process document: {file.filename}"}), 500

            document_outputs.append(document_data)

        # Flatten output if multiple files
        extracted_entries = []
        for doc_data in document_outputs:
            if isinstance(doc_data, list):
                extracted_entries.extend(doc_data)
            else:
                extracted_entries.append(doc_data)

        if not extracted_entries:
            return jsonify({"error": "No data extracted from uploaded documents."}), 500

        # Return JSON output for Spring Boot controller
        return jsonify({
            "extracted_data": extracted_entries,
            "uploaded_files": {}  # empty because Drive upload is handled by Spring Boot
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
