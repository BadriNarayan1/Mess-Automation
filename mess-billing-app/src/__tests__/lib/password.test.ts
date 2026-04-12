import {
  validatePasswordStrength,
  isPasswordStrong,
  hashPassword,
  verifyPassword,
} from '@/lib/password';

describe('Password Validation', () => {
  describe('validatePasswordStrength', () => {
    test('rejects passwords shorter than 12 characters', () => {
      const result = validatePasswordStrength('Pass@1');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('12 characters'),
        ])
      );
    });

    test('rejects passwords without uppercase', () => {
      const result = validatePasswordStrength('lowercase@pass123');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('uppercase'),
        ])
      );
    });

    test('rejects passwords without lowercase', () => {
      const result = validatePasswordStrength('UPPERCASE@PASS123');
      expect(result.valid).toBe(false);
    });

    test('rejects passwords without numbers', () => {
      const result = validatePasswordStrength('NoNumbers@Char');
      expect(result.valid).toBe(false);
    });

    test('rejects passwords without special characters', () => {
      const result = validatePasswordStrength('NoSpecial123Pass');
      expect(result.valid).toBe(false);
    });

    test('accepts valid strong passwords', () => {
      const strongPasswords = [
        'ValidStrong@Pass123',
        'Secure#Pass2024',
        'Strong!Pwd456789',
      ];

      strongPasswords.forEach(pwd => {
        const result = validatePasswordStrength(pwd);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('rejects common weak patterns', () => {
      const result = validatePasswordStrength('MyPassword@123');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining('weak pattern'),
        ])
      );
    });
  });

  describe('isPasswordStrong', () => {
    test('returns true for strong passwords', () => {
      expect(isPasswordStrong('ValidStrong@Pass123')).toBe(true);
    });

    test('returns false for weak passwords', () => {
      expect(isPasswordStrong('weak')).toBe(false);
    });
  });

  describe('hashPassword', () => {
    test('hashes password without errors', async () => {
      const hash = await hashPassword('ValidStrong@Pass123');
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    test('hash starts with $2b$13$ (13 rounds)', async () => {
      const hash = await hashPassword('ValidStrong@Pass123');
      expect(hash).toMatch(/^\$2b\$13\$/);
    });

    test('different passwords produce different hashes', async () => {
      const hash1 = await hashPassword('Pass1@Secure');
      const hash2 = await hashPassword('Pass2@Secure');
      expect(hash1).not.toBe(hash2);
    });

    test('same password produces different hashes (salt)', async () => {
      const hash1 = await hashPassword('MyPass@123');
      const hash2 = await hashPassword('MyPass@123');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    let hash: string;

    beforeAll(async () => {
      hash = await hashPassword('ValidStrong@Pass123');
    });

    test('verifies correct password', async () => {
      const result = await verifyPassword('ValidStrong@Pass123', hash);
      expect(result).toBe(true);
    });

    test('rejects wrong password', async () => {
      const result = await verifyPassword('WrongPass@123456', hash);
      expect(result).toBe(false);
    });

    test('handles invalid hash gracefully', async () => {
      const result = await verifyPassword('ValidStrong@Pass123', 'invalid_hash');
      expect(result).toBe(false);
    });
  });
});
