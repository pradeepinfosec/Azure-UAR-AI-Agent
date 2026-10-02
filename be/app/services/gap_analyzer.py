"""
gap_analyzer.py — Calculates deterministic diff between provisioned actions and executed telemetry operations.
"""

from typing import List, Dict, Any

class GapAnalyzer:
    def calculate_gap(self, provisioned_actions: List[str], executed_operations: List[str]) -> List[str]:
        """Returns relative complement: Provisioned Actions - Executed Operations."""
        executed_set = set(executed_operations)

        # Handle wildcard permission rules
        if "*" in provisioned_actions:
            # If wildcards exist, any unexecuted standard action is considered unused
            all_known = [
                "Microsoft.Authorization/*",
                "Microsoft.Compute/virtualMachines/*",
                "Microsoft.Storage/storageAccounts/*",
                "Microsoft.Network/networkInterfaces/*",
                "Microsoft.KeyVault/vaults/*"
            ]
            unused = [p for p in all_known if p not in executed_set]
            return unused

        unused = [action for action in provisioned_actions if action not in executed_set]
        return unused

if __name__ == "__main__":
    analyzer = GapAnalyzer()
    unused = analyzer.calculate_gap(["Microsoft.Compute/virtualMachines/*", "Microsoft.Storage/*"], ["Microsoft.Compute/virtualMachines/read"])
    print("Unused permissions calculated:", unused)
