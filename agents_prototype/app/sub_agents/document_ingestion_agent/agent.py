from typing import AsyncGenerator
from google.adk.agents import BaseAgent
from google.adk.events import Event
from google.adk.invocation_context import InvocationContext


import logging

logger = logging.getLogger(__name__)


class DocumentIngestionAgent(BaseAgent):
    """
    Custom agent that ingests a PDF and converts it into images.
    """

    def __init__(self, name: str, pdf_to_images_tool):
        super().__init__(
            name=name,
            sub_agents=[],  # no sub-agents, only tools
        )
        self.pdf_to_images_tool = pdf_to_images_tool

    async def _run_async_impl(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:

        logger.info(f"[{self.name}] Starting PDF ingestion")

        # --------------------------------------------------
        # 1. Read input from session state
        # --------------------------------------------------
        file_path = ctx.session.state.get("file_path")
        if not file_path:
            yield Event.text(
                author=self.name,
                text="❌ No file_path found in session state. Aborting.",
            )
            return

        yield Event.text(
            author=self.name,
            text=f"📄 Ingesting PDF at path: {file_path}",
        )

        # --------------------------------------------------
        # 2. Call the TOOL explicitly
        # --------------------------------------------------
        tool_ctx = ctx.tool_context

        result = await self.pdf_to_images_tool(
            file_path=file_path,
            tool_context=tool_ctx,
        )

        # --------------------------------------------------
        # 3. Read tool state (NOT model-visible)
        # --------------------------------------------------
        images = tool_ctx.state.get("images", [])

        ctx.session.state["num_pages"] = len(images)
        ctx.session.state["image_metadata"] = [
            {
                "page_index": img["page_index"],
                "width": img["width"],
                "height": img["height"],
                "mode": img["mode"],
            }
            for img in images
        ]

        # --------------------------------------------------
        # 4. Emit final report event
        # --------------------------------------------------
        yield Event.text(
            author=self.name,
            text=(
                f"✅ Successfully ingested {len(images)} pages.\n"
                "Image data stored internally in session state.\n"
                "one done"
            ),
        )

        logger.info(f"[{self.name}] Ingestion complete")
