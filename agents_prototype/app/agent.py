# app/agent.py
from dotenv import load_dotenv
from google.adk.agents import SequentialAgent
from google.adk.apps.app import App

# Import the CLASS
from .sub_agents.document_ingestion_agent.agent import DocumentIngestionAgent
from .sub_agents.document_ingestion_agent.tool import pdf_to_images

load_dotenv()

# Instantiate the agent HERE
document_ingestion_agent = DocumentIngestionAgent(
    name="DocumentIngestionAgent",
    pdf_to_images_tool=pdf_to_images,
)

# Compose pipeline
document_pipeline_agent = SequentialAgent(
    name="document_pipeline_agent",
    sub_agents=[document_ingestion_agent],
)

# Root agent
app = App(
    root_agent=document_pipeline_agent,
    name="app",
)
