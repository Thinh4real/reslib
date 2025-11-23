import { Validator, ensureRulesRegistered } from "./build/validator/index.js";

// Ensure rules are registered
ensureRulesRegistered();

// Test nullable validation
async function testNullableValidation() {
  console.log("Testing nullable validation...");

  // Test 1: Empty rule with empty string should succeed
  try {
    const result1 = await Validator.validate({
      value: "",
      rules: ["Empty", "Required"],
    });
    console.log("✓ Test 1 passed: empty string with Empty rule succeeds");
  } catch (error) {
    console.log("✗ Test 1 failed:", error.message);
  }

  // Test 2: Empty rule with null should fail (Required rule applied)
  try {
    await Validator.validate({
      value: null,
      rules: ["Empty", "Required"],
    });
    console.log("✗ Test 2 failed: should have failed validation");
  } catch (error) {
    console.log("✓ Test 2 passed: null value with Empty rule fails as expected");
  }

  // Test 3: Empty rule with undefined should fail (Required rule applied)
  try {
    await Validator.validate({
      value: undefined,
      rules: ["Empty", "Required"],
    });
    console.log("✗ Test 3 failed: should have failed validation");
  } catch (error) {
    console.log("✓ Test 3 passed: undefined value with Empty rule fails as expected");
  }

  // Test 4: Nullable rule with null should succeed
  try {
    const result4 = await Validator.validate({
      value: null,
      rules: ["Nullable", "Email"],
    });
    console.log("✓ Test 4 passed: null value with Nullable rule succeeds");
  } catch (error) {
    console.log("✗ Test 4 failed:", error.message);
  }

  // Test 5: Nullable rule with undefined should succeed
  try {
    const result5 = await Validator.validate({
      value: undefined,
      rules: ["Nullable", "Email"],
    });
    console.log("✓ Test 5 passed: undefined value with Nullable rule succeeds");
  } catch (error) {
    console.log("✗ Test 5 failed:", error.message);
  }

  // Test 6: Nullable rule with empty string should fail (Required rule applied)
  try {
    await Validator.validate({
      value: "",
      rules: ["Nullable", "Required"],
    });
    console.log("✗ Test 6 failed: should have failed validation");
  } catch (error) {
    console.log("✓ Test 6 passed: empty string with Nullable rule fails as expected");
  }

  // Test 7: Optional rule with undefined should succeed
  try {
    const result7 = await Validator.validate({
      value: undefined,
      rules: ["Optional", "Required"],
    });
    console.log("✓ Test 7 passed: undefined value with Optional rule succeeds");
  } catch (error) {
    console.log("✗ Test 7 failed:", error.message);
  }

  // Test 8: Optional rule with null should fail
  try {
    await Validator.validate({
      value: null,
      rules: ["Optional", "Required"],
    });
    console.log("✗ Test 8 failed: should have failed validation");
  } catch (error) {
    console.log("✓ Test 8 passed: null value with Optional rule fails as expected");
  }

  // Test 9: Optional rule with empty string should fail
  try {
    await Validator.validate({
      value: "",
      rules: ["Optional", "Required"],
    });
    console.log("✗ Test 9 failed: should have failed validation");
  } catch (error) {
    console.log("✓ Test 9 passed: empty string with Optional rule fails as expected");
  }

  // Test 10: Valid value with nullable rules should still validate other rules
  try {
    const result10 = await Validator.validate({
      value: "test@example.com",
      rules: ["Nullable", "Email"],
    });
    console.log("✓ Test 10 passed: valid email with Nullable rule succeeds");
  } catch (error) {
    console.log("✗ Test 10 failed:", error.message);
  }

  // Test 11: Invalid value with nullable rules should fail other rules
  try {
    await Validator.validate({
      value: "invalid-email",
      rules: ["Nullable", "Email"],
    });
    console.log("✗ Test 11 failed: should have failed validation");
  } catch (error) {
    console.log("✓ Test 11 passed: invalid email with Nullable rule fails as expected");
  }

  // Test 12: No nullable rules with empty value should fail
  try {
    await Validator.validate({
      value: null,
      rules: ["Required"],
    });
    console.log("✗ Test 12 failed: should have failed validation");
  } catch (error) {
    console.log("✓ Test 12 passed: null value without nullable rules fails as expected");
  }
}

// Run tests
testNullableValidation()
  .then(() => {
    console.log("All tests completed!");
  })
  .catch(console.error);
