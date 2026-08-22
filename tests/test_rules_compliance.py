"""
Unit tests for .cursor/rules/ compliance and structure.
"""

import os
import unittest
from scripts.intent_engine import RuleRegistry

class TestRulesCompliance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rules_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", ".cursor", "rules")
        )
        cls.registry = RuleRegistry(cls.rules_dir)

    def test_rules_loaded(self):
        self.assertGreater(len(self.registry.rules), 0, "No rules were loaded from .cursor/rules/")

    def test_rule_frontmatter_description(self):
        for rule in self.registry.rules:
            self.assertTrue(rule.description, f"{rule.filename} is missing a description.")

    def test_always_apply_rules(self):
        always_apply_rules = self.registry.get_applicable_rules("")
        self.assertGreater(len(always_apply_rules), 0, "Expected at least 1 alwaysApply rule.")

    def test_glob_matching(self):
        py_rules = self.registry.get_applicable_rules("backend/main.py")
        self.assertTrue(any("code-architecture" in r.filename for r in py_rules), "Expected architecture rule for backend/main.py")

if __name__ == "__main__":
    unittest.main()
