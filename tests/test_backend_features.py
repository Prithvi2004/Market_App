"""
Unit tests for Sister-Company Ripple Engine and Senior Analyst IPO Hub.
"""

import sys
import os
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "market-app", "backend")))

from conglomerates import get_conglomerate_for_ticker
from llm.ripple_analyzer import generate_ripple_analysis
from llm.ipo_analyst import analyze_ipo_deep
from routers.ipo import VERIFIED_INDIAN_IPOS

class TestBackendFeatures(unittest.TestCase):
    def test_conglomerate_mapping_tata(self):
        res = get_conglomerate_for_ticker("TATAMOTORS.NS")
        self.assertIsNotNone(res)
        self.assertEqual(res["group_name"], "Tata Group")
        self.assertTrue(any(s["symbol"] == "TATASTEEL.NS" for s in res["sister_companies"]))

    def test_conglomerate_mapping_reliance(self):
        res = get_conglomerate_for_ticker("RELIANCE.NS")
        self.assertIsNotNone(res)
        self.assertEqual(res["group_name"], "Reliance Industries Group")

    def test_ripple_analysis_fallback(self):
        res = generate_ripple_analysis("TATAMOTORS.NS", [])
        self.assertEqual(res["group_name"], "Tata Group")
        self.assertIn("sister_spillovers", res)

    def test_ipo_deep_analysis(self):
        sample_ipo = VERIFIED_INDIAN_IPOS[0]
        res = analyze_ipo_deep(sample_ipo)
        self.assertIn("recommendation", res)
        self.assertTrue("allotment_maximizer_strategy" in res or "allotment_maximizer_steps" in res)

if __name__ == "__main__":
    unittest.main()
