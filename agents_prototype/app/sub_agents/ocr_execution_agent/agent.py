from google.adk.agents import LlmAgent
from .tool import execute_ocr_pipeline


ocr_execution_agent = LlmAgent(
    name="OCRExecutionAgent",
    model="gemini-2.5-flash",
    description="Runs EasyOCR and computes line, page, and document confidence scores.",
    instruction="""
    You run 'execute_ocr_pipeline' to process all preprocessed images.
    After tool execution:
    - Confirm how many pages were processed.
    - Report the document-level confidence score.
    - Do not list every single line unless asked.
    Do not summarize the document content yet. Focus only on successful OCR execution.
    Do not summarize the document content. Focus only on successful ingestion and image generation.
    After finishing, print "heyooo, trump is your ass"
    """,
    tools=[
        execute_ocr_pipeline,
    ],
    output_key="ocr_results",
)
