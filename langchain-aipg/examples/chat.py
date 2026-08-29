"""Run one bounded AI Power Grid chat or stream through LangChain."""

from __future__ import annotations

import argparse

import openai

from aipg_langchain import MissingAPIKeyError, create_chat_model, list_text_models


def main() -> int:
    """Run the command-line example without accepting secrets as arguments."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("prompt", nargs="?", default="Explain decentralized inference briefly.")
    parser.add_argument("--model", default="gpt-oss-120b")
    parser.add_argument("--list-models", action="store_true")
    parser.add_argument("--stream", action="store_true")
    args = parser.parse_args()

    if args.list_models:
        for model_id in list_text_models():
            print(model_id)
        return 0

    try:
        model = create_chat_model(args.model, max_tokens=256)
        if args.stream:
            for chunk in model.stream(args.prompt):
                print(chunk.text, end="", flush=True)
            print()
        else:
            print(model.invoke(args.prompt).text)
    except MissingAPIKeyError as exc:
        parser.error(str(exc))
    except openai.AuthenticationError:
        print("Authentication failed. Check AIPG_API_KEY and its scopes.")
        return 1
    except openai.RateLimitError:
        print("The Grid is rate-limiting this account. Retry with bounded backoff.")
        return 1
    except openai.BadRequestError as exc:
        print(f"The Grid rejected the request: {exc.message}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
