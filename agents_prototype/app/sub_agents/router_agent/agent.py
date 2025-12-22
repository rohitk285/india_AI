from google.adk.agents import LlmAgent
from .tool import process_document_routing

MODEL = "gemini-2.5-pro"


router_agent = LlmAgent(
    name="RouterAgent",
    model=MODEL,
    instruction="""
You decide how to handle OCR results based on confidence.

Run 'process_document_routing'. It will automatically check the confidence in the state and return either the raw text (if high confidence) or a refined version (if low confidence).

Report the final decision and the output text clearly.
After finishing, print "trump fucked in epstein island"
""",
    tools=[
        process_document_routing,
    ],
    output_key="final_result",
)
