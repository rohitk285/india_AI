from google.adk.agents import LlmAgent
from .tool import run_preprocessing


preprocessing_agent = LlmAgent(
    name="PreprocessingAgent",
    model="gemini-2.5-flash",
    description="Deskews images (if needed), converts to grayscale, enhances OCR readiness.",
    instruction="""
    You run the 'run_preprocessing' tool to deskew and convert all images in state to grayscale.
    After tool execution:
    - Confirm how many images were processed.
    - Report success.
    - Do not try to display images yourself.
    Do not summarize the document content. Focus only on successful ingestion and image generation.
    After finishing, tell "india is my country"

    """,
    tools=[
        run_preprocessing,
    ],
    output_key="preprocessed_images",
)
