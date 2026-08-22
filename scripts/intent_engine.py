"""
Intent Engine & Rule Management Module.

Parses .cursor/rules/*.md files, extracts frontmatter and rule content,
and matches user queries / target file paths to relevant system instructions and tool actions.
"""

from __future__ import annotations
import os
import re
import fnmatch
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class Rule:
    filename: str
    description: str
    globs: List[str]
    always_apply: bool
    content: str

    def applies_to_path(self, filepath: str) -> bool:
        if self.always_apply:
            return True
        norm_path = filepath.replace('\\', '/')
        for pattern in self.globs:
            if fnmatch.fnmatch(norm_path, pattern):
                return True
        return False

class RuleRegistry:
    def __init__(self, rules_dir: str):
        self.rules_dir = rules_dir
        self.rules: List[Rule] = []
        self.load_rules()

    def load_rules(self) -> None:
        self.rules.clear()
        if not os.path.exists(self.rules_dir):
            return

        for fname in os.listdir(self.rules_dir):
            if fname.endswith(".md"):
                fpath = os.path.join(self.rules_dir, fname)
                rule = self._parse_rule_file(fpath)
                if rule:
                    self.rules.append(rule)

    def _parse_rule_file(self, filepath: str) -> Optional[Rule]:
        with open(filepath, "r", encoding="utf-8") as f:
            raw = f.read()

        frontmatter_match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw, re.DOTALL)
        if not frontmatter_match:
            return None

        fm_text = frontmatter_match.group(1)
        content = frontmatter_match.group(2).strip()

        description = ""
        globs = ["**/*"]
        always_apply = False

        for line in fm_text.splitlines():
            line = line.strip()
            if line.startswith("description:"):
                description = line.split(":", 1)[1].strip().strip('"\'')
            elif line.startswith("globs:"):
                raw_globs = line.split(":", 1)[1].strip()
                globs = [g.strip(" []\"'") for g in raw_globs.split(",") if g.strip(" []\"'")]
            elif line.startswith("alwaysApply:"):
                val = line.split(":", 1)[1].strip().lower()
                always_apply = val == "true"

        return Rule(
            filename=os.path.basename(filepath),
            description=description,
            globs=globs,
            always_apply=always_apply,
            content=content
        )

    def get_applicable_rules(self, filepath: str = "") -> List[Rule]:
        if not filepath:
            return [r for r in self.rules if r.always_apply]
        return [r for r in self.rules if r.applies_to_path(filepath)]


class IntentEngine:
    def __init__(self, registry: RuleRegistry):
        self.registry = registry

    def resolve_intent(self, user_query: str, target_file: str = "") -> Dict[str, Any]:
        rules = self.registry.get_applicable_rules(target_file)
        rule_names = [r.filename for r in rules]
        
        # Simple intent categorization
        query_lower = user_query.lower()
        if "plan" in query_lower or "design" in query_lower or "architect" in query_lower:
            intent_type = "plan"
        elif "fix" in query_lower or "bug" in query_lower or "error" in query_lower:
            intent_type = "debug"
        elif "refactor" in query_lower or "restructure" in query_lower:
            intent_type = "refactor"
        else:
            intent_type = "general"

        system_instructions = "\n\n".join([f"--- Rule: {r.filename} ---\n{r.content}" for r in rules])

        return {
            "intent_type": intent_type,
            "query": user_query,
            "target_file": target_file,
            "active_rules": rule_names,
            "system_instructions": system_instructions
        }
