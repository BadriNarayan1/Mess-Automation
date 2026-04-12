import bcrypt from "bcryptjs";
import crypto from "crypto";

// Strong password policy configuration
const PASSWORD_POLICY = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
  bcryptRounds: 13, // 13 rounds = ~150ms per hash (strong security)
} as const;

/**
 * Validate password strength against security policy
 * Returns validation result with specific error messages
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_POLICY.minLength} characters (you provided ${password.length})`
    );
  }

  // Check for uppercase letters
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter (A-Z)");
  }

  // Check for lowercase letters
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter (a-z)");
  }

  // Check for numbers
  if (PASSWORD_POLICY.requireNumbers && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number (0-9)");
  }

  // Check for special characters
  if (PASSWORD_POLICY.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?/\\]/.test(password)) {
    errors.push(
      "Password must contain at least one special character (!@#$%^&* etc.)"
    );
  }

  // Check for common weak passwords
  const commonPasswords = [
    "password",
    "admin",
    "123456",
    "qwerty",
    "welcome",
    "letmein",
    "monkey",
    "dragon",
  ];
  if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
    errors.push("Password contains a commonly used weak pattern");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Hash a password using bcrypt with configured rounds
 * IMPORTANT: This is CPU-intensive, should be done in background/queue for production
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    // 13 rounds = ~150ms per hash
    const hash = await bcrypt.hash(password, PASSWORD_POLICY.bcryptRounds);
    return hash;
  } catch (error) {
    console.error("[Password] Hashing error:", error);
    throw new Error("Failed to hash password");
  }
}

/**
 * Verify a password against a bcrypt hash
 * Protected against timing attacks (bcrypt.compare uses constant-time comparison)
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    // bcrypt.compare is constant-time: takes same duration whether password matches or not
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error("[Password] Verification error:", error);
    // Return false on error, never throw
    return false;
  }
}

/**
 * Generate a secure random reset token
 * Returns both plaintext (for sending) and hash (for storing)
 */
export function generateResetToken(): {
  token: string;
  hash: Promise<string>;
  expiresAt: Date;
} {
  // Generate 32 random bytes = 256 bits of entropy
  const token = crypto.randomBytes(32).toString("hex");

  // Hash the token for storage (even reset tokens should be hashed)
  const hash = bcrypt.hash(token, 10); // Reset tokens use 10 rounds (they expire anyway)

  return {
    token, // Send this in email
    hash, // Store this in database
    expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour expiry
  };
}

/**
 * Check if new password was previously used
 * Prevents password reuse attacks
 */
export async function checkPasswordReuse(
  newPassword: string,
  previousHashes: string[]
): Promise<boolean> {
  if (previousHashes.length === 0) return false;

  try {
    for (const oldHash of previousHashes) {
      const matches = await verifyPassword(newPassword, oldHash);
      if (matches) {
        return true; // Password WAS used before
      }
    }
    return false; // Password is new
  } catch (error) {
    console.error("[Password] Password reuse check error:", error);
    return false;
  }
}

/**
 * Get human-readable password requirements
 * Use in frontend to show requirements to users
 */
export function getPasswordRequirements(): string {
  return `Password must have:
• At least ${PASSWORD_POLICY.minLength} characters
• At least one uppercase letter (A-Z)
• At least one lowercase letter (a-z)
• At least one number (0-9)
• At least one special character (!@#$%^&* etc.)`;
}

/**
 * Quick password check for real-time validation feedback
 * Returns true if password meets ALL requirements
 */
export function isPasswordStrong(password: string): boolean {
  return validatePasswordStrength(password).valid;
}

// Export configuration for testing/debugging (don't use in production logic)
export function getBcryptRounds(): number {
  return PASSWORD_POLICY.bcryptRounds;
}
