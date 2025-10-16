// Test the extracted utility functions for better coverage
const {
  disableSignatures,
  validatePort,
  isCommitSha,
  getDownloadUrl,
  validateFilePath,
  isAllowedHost
} = require('../../lib/utils');

describe('Utility Functions (Extracted)', () => {
  
  describe('disableSignatures', () => {
    test('should disable signatures in boot config', () => {
      const config = 'set sigs_enabled true\necho "Boot menu"';
      const result = disableSignatures(config);
      expect(result).toBe('set sigs_enabled false\necho "Boot menu"');
    });

    test('should handle config without signatures', () => {
      const config = 'echo "Boot menu"\nset timeout 30';
      const result = disableSignatures(config);
      expect(result).toBe(config);
    });
  });

  describe('validatePort', () => {
    test('should validate correct ports', () => {
      expect(validatePort('3000')).toBe(3000);
      expect(validatePort('8080')).toBe(8080);
      expect(validatePort('65535')).toBe(65535);
    });

    test('should return default for invalid ports', () => {
      expect(validatePort('invalid')).toBe(3000);
      expect(validatePort('0')).toBe(3000);
      expect(validatePort('99999')).toBe(3000);
      expect(validatePort('-1')).toBe(3000);
    });

    test('should use custom default port', () => {
      expect(validatePort('invalid', 8080)).toBe(8080);
    });
  });

  describe('isCommitSha', () => {
    test('should identify valid commit SHAs', () => {
      expect(isCommitSha('a1b2c3d4e5f6789012345678901234567890abcd')).toBe(true);
      expect(isCommitSha('1234567890123456789012345678901234567890')).toBe(true);
    });

    test('should reject invalid commit SHAs', () => {
      expect(isCommitSha('v2.0.0')).toBe(false);
      expect(isCommitSha('short')).toBe(false);
      expect(isCommitSha('toolong123456789012345678901234567890123')).toBe(false);
      expect(isCommitSha('invalid-chars-here1234567890123456789012')).toBe(false);
    });
  });

  describe('getDownloadUrl', () => {
    test('should generate S3 URLs for commit SHAs', () => {
      const sha = 'a1b2c3d4e5f6789012345678901234567890abcd';
      const url = getDownloadUrl(sha, 'netboot.xyz.efi');
      expect(url).toBe('https://s3.amazonaws.com/dev.boot.netboot.xyz/a1b2c3d4e5f6789012345678901234567890abcd/ipxe/netboot.xyz.efi');
    });

    test('should generate GitHub URLs for releases', () => {
      const url = getDownloadUrl('v2.0.0', 'netboot.xyz.efi');
      expect(url).toBe('https://github.com/netbootxyz/netboot.xyz/releases/download/v2.0.0/netboot.xyz.efi');
    });

    test('should handle empty file parameter', () => {
      const url = getDownloadUrl('v2.0.0');
      expect(url).toBe('https://github.com/netbootxyz/netboot.xyz/releases/download/v2.0.0/');
    });
  });

  describe('validateFilePath', () => {
    test('should validate secure file paths', () => {
      const result = validateFilePath('safe-file.txt', '/config/menus/local/');
      expect(result.isSecure).toBe(true);
      expect(result.path).toContain('safe-file.txt');
    });

    test('should reject directory traversal attempts', () => {
      const result = validateFilePath('../../../etc/passwd', '/config/menus/local/');
      expect(result.isSecure).toBe(false);
    });

    test('should handle subdirectories', () => {
      const result = validateFilePath('subdir/file.txt', '/config/menus/local/');
      expect(result.isSecure).toBe(true);
    });
  });

  describe('isAllowedHost', () => {
    test('should allow S3 hosts by default', () => {
      expect(isAllowedHost('https://s3.amazonaws.com/file.tar.gz')).toBe(true);
    });

    test('should reject other hosts', () => {
      expect(isAllowedHost('https://malicious-site.com/file.tar.gz')).toBe(false);
      expect(isAllowedHost('https://github.com/user/repo/file.tar.gz')).toBe(false);
    });

    test('should handle custom allowed hosts', () => {
      const customHosts = ['github.com', 'gitlab.com'];
      expect(isAllowedHost('https://github.com/user/repo', customHosts)).toBe(true);
      expect(isAllowedHost('https://bitbucket.org/user/repo', customHosts)).toBe(false);
    });

    test('should handle invalid URLs', () => {
      expect(isAllowedHost('not-a-url')).toBe(false);
      expect(isAllowedHost('')).toBe(false);
    });
  });
});