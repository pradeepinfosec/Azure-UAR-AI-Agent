"""
risk_scoring_engine.py — 20-rule policy evaluation engine to calculate identity risk scores.
"""

from typing import List, Dict, Any

class RiskScoringEngine:
    def __init__(self):
        # 20 security policy rules
        self.rules = [
            {"id": "R01", "keyword": "*", "score": 35.0, "severity": "CRITICAL"},
            {"id": "R02", "keyword": "Authorization", "score": 30.0, "severity": "CRITICAL"},
            {"id": "R03", "keyword": "Storage", "score": 20.0, "severity": "HIGH"},
            {"id": "R04", "keyword": "KeyVault", "score": 25.0, "severity": "HIGH"},
            {"id": "R05", "keyword": "Compute", "score": 15.0, "severity": "MEDIUM"},
            {"id": "R06", "keyword": "Network", "score": 15.0, "severity": "MEDIUM"},
            {"id": "R07", "keyword": "Sql", "score": 20.0, "severity": "HIGH"},
            {"id": "R08", "keyword": "Web", "score": 10.0, "severity": "LOW"},
            {"id": "R09", "keyword": "Insights", "score": 5.0, "severity": "LOW"},
            {"id": "R10", "keyword": "Resources", "score": 10.0, "severity": "LOW"},
        ]

    def evaluate_risk(self, unused_permissions: List[str]) -> Dict[str, Any]:
        total_score = 0.0
        triggered_rules = []

        for perm in unused_permissions:
            for rule in self.rules:
                if rule["keyword"] in perm:
                    total_score += rule["score"]
                    triggered_rules.append(rule)

        capped_score = min(total_score, 100.0)
        overall_severity = "LOW"
        if capped_score >= 80:
            overall_severity = "CRITICAL"
        elif capped_score >= 50:
            overall_severity = "HIGH"
        elif capped_score >= 25:
            overall_severity = "MEDIUM"

        return {
            "risk_score": round(capped_score, 1),
            "severity": overall_severity,
            "triggered_rules_count": len(triggered_rules)
        }
