#!/usr/bin/env node

/**
 * Admin Password Setup Script
 * Generates bcrypt hash with 13 rounds for ADMIN_PASSWORD_HASH env var
 *
 * ENFORCES SAME STRONG PASSWORD POLICY AS STUDENT PASSWORDS:
 * • Minimum 12 characters
 * • At least 1 uppercase letter (A-Z)
 * • At least 1 lowercase letter (a-z)
 * • At least 1 number (0-9)
 * • At least 1 special character (!@#$%^&* etc.)
 *
 * Usage:
 *   node generate-admin-hash.mjs
 *   node generate-admin-hash.mjs "your-admin-password"
 */

import bcrypt from "bcryptjs";
import { createInterface } from "readline";

const BCRYPT_ROUNDS = 13;

/**
 * Validate admin password strength
 * MUST meet ALL requirements (same as student passwords)
 */
function validateAdminPassword(password) {
  const errors = [];

  // Check minimum length
  if (password.length < 12) {
    errors.push(`❌ Password must be at least 12 characters (you provided ${password.length})`);
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push("❌ Password must contain at least one uppercase letter (A-Z)");
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push("❌ Password must contain at least one lowercase letter (a-z)");
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    errors.push("❌ Password must contain at least one number (0-9)");
  }

  // Check for special characters
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?/\\]/.test(password)) {
    errors.push("❌ Password must contain at least one special character (!@#$%^&* etc.)");
  }

  // Check for common weak passwords
  const commonPasswords = ["password", "admin", "123456", "qwerty", "welcome", "letmein", "monkey", "dragon"];
  if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
    errors.push("❌ Password contains a commonly used weak pattern");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function generateAdminHash() {
  let password;

  // Get password from command line or prompt
  if (process.argv[2]) {
    password = process.argv[2];
  } else {
    // Prompt for password (hidden input)
    password = await promptPassword("Enter admin password: ");
  }

  if (!password || password.length === 0) {
    console.error(
      "❌ Error: Password is required"
    );
    process.exit(1);
  }

  // Validate password strength (REQUIRED - not optional!)
  const validation = validateAdminPassword(password);

  if (!validation.valid) {
    console.error("\n❌ Password does not meet security requirements:\n");
    validation.errors.forEach(error => console.error(`   ${error}`));
    console.error("\n📋 Admin Password Requirements:");
    console.error("   • Minimum 12 characters");
    console.error("   • At least one uppercase letter (A-Z)");
    console.error("   • At least one lowercase letter (a-z)");
    console.error("   • At least one number (0-9)");
    console.error("   • At least one special character (!@#$%^&* etc.)\n");
    process.exit(1);
  }

  console.log(`\n🔐 Generating bcrypt hash with ${BCRYPT_ROUNDS} rounds...`);
  console.log("This may take 30-60 seconds...\n");

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  console.log("✅ Admin password hash generated successfully!\n");
  console.log("Add this to your .env file:\n");
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
  console.log("Keep this hash safe and never commit to git!\n");
}

function promptPassword(question) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    // For terminal input with hidden password
    if (process.stdin.isTTY) {
      process.stdout.write(question);
      process.stdin.setRawMode(true);

      let password = "";
      process.stdin.on("data", function (char) {
        char = char.toString();

        switch (char) {
          case "\n":
          case "\r":
          case "\u0004":
            // Enter key pressed
            process.stdin.setRawMode(false);
            process.stdout.write("\n");
            rl.close();
            resolve(password);
            break;
          case "\u0003":
            // Ctrl+C
            process.exit();
            break;
          default:
            // Ignore backspace
            if (char !== "\u007f") {
              password += char;
            }
        }
      });
    } else {
      // For non-TTY input (piped password)
      rl.on("line", (line) => {
        rl.close();
        resolve(line);
      });
    }
  });
}

generateAdminHash().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
