import os
import sys
import unittest

# Add workspace root to sys.path so tests can be run from any working directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from ai.services.mitre_mapper import MITREMapper
from ai.services.role_template_generator import RoleTemplateGenerator

class TestAISynthesis(unittest.TestCase):
    def test_mitre_mapping_fallback(self):
        mapper = MITREMapper()
        result = mapper.map_unused_permissions(["Microsoft.Storage/*"])
        self.assertTrue(len(result) > 0)
        self.assertEqual(result[0]["technique_id"], "T1530")

    def test_role_generation(self):
        generator = RoleTemplateGenerator()
        role = generator.generate_custom_role("Tester", ["Microsoft.Compute/virtualMachines/read"])
        self.assertTrue(role["IsCustom"])
        self.assertIn("Microsoft.Compute/virtualMachines/read", role["Actions"])

if __name__ == "__main__":
    unittest.main()
