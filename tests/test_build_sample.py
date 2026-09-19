import math
import unittest

from pipeline.build_sample import as_number, meter_role, rounded


class MeterClassificationTests(unittest.TestCase):
    def test_classifies_public_sample_meter_types(self):
        self.assertEqual(meter_role("UDB1_ULC_5"), "it_load")
        self.assertEqual(meter_role("ADB1_CRAC3"), "cooling")
        self.assertEqual(meter_role("DB_MAIN"), "facility_total")

    def test_ignores_unknown_meters(self):
        self.assertIsNone(meter_role("UPS_A"))


class NumberParsingTests(unittest.TestCase):
    def test_parses_valid_power_values(self):
        self.assertEqual(as_number("14.25"), 14.25)
        self.assertEqual(as_number("0"), 0.0)

    def test_rejects_invalid_or_non_finite_values(self):
        self.assertIsNone(as_number(None))
        self.assertIsNone(as_number("not-a-number"))
        self.assertIsNone(as_number(str(math.inf)))

    def test_rounds_display_values_consistently(self):
        self.assertEqual(rounded(2.67345, 3), 2.673)


if __name__ == "__main__":
    unittest.main()
