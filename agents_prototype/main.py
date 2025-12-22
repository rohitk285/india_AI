import asyncio
import os
from dotenv import load_dotenv

from google.adk.runners import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.genai import types as genai_types

from app.agent import app  # App(root_agent=...)

# Load environment variables
load_dotenv()


async def main():
    # ------------------------------------------------------------------
    # 1. Resolve PDF path
    # ------------------------------------------------------------------
    pdf_filename = "106123065_KarthikeyanTS.pdf"
    file_path = os.path.abspath(pdf_filename)

    if not os.path.exists(file_path):
        print(f"❌ Error: File '{pdf_filename}' not found.")
        return

    print("🚀 Triggering root agent for PDF ingestion")
    print(f"📄 PDF: {file_path}\n")

    # ------------------------------------------------------------------
    # 2. Setup session + runner
    # ------------------------------------------------------------------
    session_service = InMemorySessionService()
    runner = Runner(app=app, session_service=session_service)

    session = await session_service.create_session(
        app_name="app",
        user_id="terminal_user",
    )

    # ------------------------------------------------------------------
    # 3. Construct STRUCTURED prompt
    # ------------------------------------------------------------------
    # This is the important fix:
    # we explicitly tell the agent which argument to use
    prompt_text = (
        "Use the pdf_to_images tool to ingest the PDF at the given file_path.\n"
        "file_path:\n"
        f"{file_path}"
    )

    prompt_content = genai_types.Content(
    role="user",
    parts=[genai_types.Part.from_text(text=prompt_text)],
)


    print("----- Agent Output -----\n")

    # ------------------------------------------------------------------
    # 4. Run the root agent
    # ------------------------------------------------------------------
    async for event in runner.run_async(
        new_message=prompt_content,
        session_id=session.id,
        user_id="terminal_user",
    ):
        # Print model text output
        if event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    print(part.text, end="", flush=True)

        # Log tool calls
        calls = event.get_function_calls()
        if calls:
            call = calls[0]
            print(f"\n\n🔧 Tool Call: {call.name}")
            print(f"   args: {call.args}")

        # Log tool responses
        responses = event.get_function_responses()
        if responses:
            response = responses[0]
            print(f"\n✅ Tool Response received: {response.name}")

    print("\n\n✅ Execution finished.")


if __name__ == "__main__":
    asyncio.run(main())
