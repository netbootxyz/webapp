// Test the extracted utility functions for better coverage
const {
  disableSignatures,
  validatePort,
  isCommitSha,
  getDownloadUrl,
  validateFilePath,
  isAllowedHost,
  MAX_ASSET_PARTS,
  getPartName,
  isAssetPart,
  findRemoteParts,
  findLocalParts
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

  describe('getPartName', () => {
    test('should add the part suffix to the file name', () => {
      expect(getPartName('/a/filesystem.squashfs', 2)).toBe('/a/filesystem.squashfs.part2');
      expect(getPartName('/a/filesystem.squashfs', 10)).toBe('/a/filesystem.squashfs.part10');
    });
  });

  describe('isAssetPart', () => {
    test('should find part files of any number', () => {
      expect(isAssetPart('/a/filesystem.squashfs.part2')).toBe(true);
      expect(isAssetPart('/a/filesystem.squashfs.part3')).toBe(true);
      expect(isAssetPart('/a/filesystem.squashfs.part10')).toBe(true);
    });

    test('should not find files that are not parts', () => {
      expect(isAssetPart('/a/filesystem.squashfs')).toBe(false);
      expect(isAssetPart('/a/file.part')).toBe(false);
      expect(isAssetPart('/a/file.part2.txt')).toBe(false);
      expect(isAssetPart('/a/file.partx')).toBe(false);
    });
  });

  describe('findRemoteParts', () => {
    const url = 'https://github.com/netbootxyz/x/releases/download/1/filesystem.squashfs';

    // Make a fetch function that finds only the given URLs
    const fakeFetch = (found) => jest.fn(async (u) => ({ ok: found.includes(u) }));

    test('should find all parts until a part is not found', async () => {
      const fetchFn = fakeFetch([url + '.part2', url + '.part3']);
      const parts = await findRemoteParts(url, fetchFn);
      expect(parts).toEqual([url + '.part2', url + '.part3']);
      expect(fetchFn).toHaveBeenCalledTimes(3);
      expect(fetchFn).toHaveBeenLastCalledWith(url + '.part4', { method: 'HEAD' });
    });

    test('should return no parts for a single file asset', async () => {
      const fetchFn = fakeFetch([]);
      expect(await findRemoteParts(url, fetchFn)).toEqual([]);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    test('should not look after a missing part', async () => {
      const fetchFn = fakeFetch([url + '.part2', url + '.part4']);
      expect(await findRemoteParts(url, fetchFn)).toEqual([url + '.part2']);
    });

    test('should stop when the request fails', async () => {
      const fetchFn = jest.fn(async () => { throw new Error('network'); });
      expect(await findRemoteParts(url, fetchFn)).toEqual([]);
    });

    test('should stop at the maximum number of parts', async () => {
      const fetchFn = jest.fn(async () => ({ ok: true }));
      const parts = await findRemoteParts(url, fetchFn, 5);
      expect(parts).toEqual([url + '.part2', url + '.part3', url + '.part4', url + '.part5']);
      expect((await findRemoteParts(url, fetchFn)).length).toBe(MAX_ASSET_PARTS - 1);
    });
  });

  describe('findLocalParts', () => {
    const file = '/assets/x/filesystem.squashfs';

    test('should find all local parts until a part is missing', () => {
      const files = [file + '.part2', file + '.part3', file + '.part5'];
      const existsFn = (f) => files.includes(f);
      expect(findLocalParts(file, existsFn)).toEqual([file + '.part2', file + '.part3']);
    });

    test('should return no parts for a single file asset', () => {
      expect(findLocalParts(file, () => false)).toEqual([]);
    });

    test('should stop at the maximum number of parts', () => {
      expect(findLocalParts(file, () => true, 3)).toEqual([file + '.part2', file + '.part3']);
    });
  });
});
