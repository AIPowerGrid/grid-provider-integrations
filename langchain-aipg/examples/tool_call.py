"""Ask a tool-capable Grid model to call a small local function."""

from langchain_core.tools import tool

from aipg_langchain import create_chat_model


@tool
def multiply(left: int, right: int) -> int:
    """Multiply two integers."""
    return left * right


model = create_chat_model("gpt-oss-120b", max_tokens=128)
response = model.bind_tools([multiply], tool_choice="auto").invoke("What is 17 times 23?")

for call in response.tool_calls:
    if call["name"] == multiply.name:
        print(multiply.invoke(call))
