"""
Unit tests for the Intent Engine.
"""

import os
import unittest
from scripts.intent_engine import RuleRegistry, IntentEngine

class TestIntentEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rules_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", ".cursor", "rules")
        )
        cls.registry = RuleRegistry(cls.rules_dir)
        cls.engine = IntentEngine(cls.registry)

    def test_plan_intent(self):
        res = self.engine.resolve_intent("Create a plan to refactor the database layer")
        self.assertEqual(res["intent_type"], "plan")
        self.assertIn("01-core-behavior.md", res["active_rules"])

    def test_debug_intent(self):
        res = self.engine.resolve_intent("Fix 500 error in /api/indices", "backend/main.py")
        self.assertEqual(res["intent_type"], "debug")
        self.assertIn("02-code-architecture.md", res["active_rules"])

    def test_system_instructions_non_empty(self):
        res = self.engine.resolve_intent("Explain how caching works")
        self.assertTrue(len(res["system_instructions"]) > 0)

if __name__ == "__main__":
    unittest.main()
