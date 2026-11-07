import unittest
from types import SimpleNamespace as Obj
from unittest.mock import patch

import main


class QueryRoutingTests(unittest.TestCase):
    @patch.dict(main.os.environ, {"OPENROUTER_API_KEY": "test-key"})
    @patch.object(main.requests, "post")
    def test_jev_selects_each_route_with_documented_api(self, post):
        for route in ("RAG", "LLM", "WebSearch"):
            post.return_value.json.return_value = {
                "answers": {"route": {"type": "choice", "choice": route}}
            }
            self.assertEqual(main.classify_query("question", True), route)
        call = post.call_args
        self.assertEqual(call.args[0], "https://openrouter.ai/api/alpha/decisions")
        self.assertEqual(call.kwargs["headers"]["Authorization"], "Bearer test-key")
        self.assertEqual(set(call.kwargs["json"]["questions"]["route"]["criteria"]),
                         {"RAG", "LLM", "WebSearch"})
        post.return_value.raise_for_status.assert_called()

    @patch.dict(main.os.environ, {"OPENROUTER_API_KEY": "test-key"})
    @patch.object(main.requests, "post")
    def test_unavailable_documents_and_invalid_output(self, post):
        post.return_value.json.return_value = {
            "answers": {"route": {"type": "choice", "choice": "RAG"}}
        }
        self.assertEqual(main.classify_query("question", False), "LLM")
        for payload in ({}, {"answers": {"route": {"type": "choice", "choice": "bad"}}}):
            post.return_value.json.return_value = payload
            self.assertEqual(main.classify_query("question", True), "RAG")
        post.side_effect = main.requests.Timeout()
        self.assertEqual(main.classify_query("question", False), "LLM")

    @patch.dict(main.os.environ, {"OPENROUTER_API_KEY": ""})
    @patch.object(main.requests, "post")
    def test_missing_key_does_not_send_request(self, post):
        self.assertEqual(main.classify_query("question"), "LLM")
        post.assert_not_called()

    @patch.object(main, "OpenAI")
    def test_search_requires_tool_and_preserves_source_links(self, client):
        client.return_value.responses.create.return_value = Obj(
            output_text="Verified finding.",
            output=[Obj(type="web_search_call"), Obj(type="message", content=[Obj(
                annotations=[Obj(type="url_citation", url="https://example.com/news", title="News")]
            )])],
        )
        result = main.search_web("latest news")
        self.assertIn("https://example.com/news", result)
        self.assertEqual(client.return_value.responses.create.call_args.kwargs["input"], "latest news")
        client.return_value.responses.create.return_value.output = []
        self.assertIn("could not be verified", main.search_web("latest news"))

    @patch.object(main, "OpenAI", side_effect=RuntimeError("offline"))
    def test_search_failure_is_explicit(self, client):
        self.assertIn("do not claim a successful search", main.search_web("news"))
