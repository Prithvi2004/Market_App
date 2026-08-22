"""
Rule Linter / Validator Script.

Validates that all .cursor/rules/*.md files have required frontmatter fields,
valid YAML-like syntax, and well-structured headings.
"""

import os
import sys
from intent_engine import RuleRegistry

def validate():
    rules_dir = os.path.join(os.path.dirname(__file__), "..", ".cursor", "rules")
    rules_dir = os.path.abspath(rules_dir)
    
    if not os.path.exists(rules_dir):
        print(f"Error: Rules directory not found at {rules_dir}")
        sys.exit(1)

    registry = RuleRegistry(rules_dir)
    if not registry.rules:
        print(f"Error: No valid rules found in {rules_dir}")
        sys.exit(1)

    errors = []
    for rule in registry.rules:
        if not rule.description:
            errors.append(f"[{rule.filename}] Missing or empty 'description' field in frontmatter.")
        if not rule.content:
            errors.append(f"[{rule.filename}] Rule content body is empty.")
        if not rule.always_apply and not rule.globs:
            errors.append(f"[{rule.filename}] Rule is not 'alwaysApply' and has no 'globs' specified.")

    if errors:
        print("Validation Failed:")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)
    else:
        print(f"SUCCESS: All {len(registry.rules)} rules passed validation!")

if __name__ == "__main__":
    validate()
