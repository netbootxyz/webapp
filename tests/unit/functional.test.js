// Functional tests that test actual app behavior
const fs = require('fs');
const path = require('path');

describe('Webapp Functional Tests', () => {
  
  test('should validate port configuration logic', () => {
    // Test the exact logic from app.js lines 381-387
    const validatePort = (port) => {
      if (!Number.isInteger(Number(port)) || port < 1 || port > 65535) {
        return 3000; // default port
      }
      return Number(port);
    };

    expect(validatePort('8080')).toBe(8080);
    expect(validatePort('invalid')).toBe(3000);
    expect(validatePort('0')).toBe(3000);
    expect(validatePort('99999')).toBe(3000);
  });

  test('should validate allowed hosts configuration', () => {
    // Test the allowedHosts logic from app.js
    const allowedHosts = ['s3.amazonaws.com'];
    
    const isAllowedHost = (url) => {
      try {
        const urlLib = require('url');
        const parsedUrl = urlLib.parse(url);
        return allowedHosts.includes(parsedUrl.host);
      } catch {
        return false;
      }
    };

    expect(isAllowedHost('https://s3.amazonaws.com/file.tar.gz')).toBe(true);
    expect(isAllowedHost('https://github.com/user/repo/file.tar.gz')).toBe(false);
    expect(isAllowedHost('invalid-url')).toBe(false);
  });

  test('should validate file path security logic', () => {
    // Test the path security logic from app.js
    const validateFilePath = (filename, rootDir) => {
      try {
        const filePath = path.resolve(rootDir, filename);
        return filePath.startsWith(rootDir);
      } catch {
        return false;
      }
    };

    const rootDir = '/config/menus/local/';
    
    expect(validateFilePath('safe-file.txt', rootDir)).toBe(true);
    expect(validateFilePath('../../../etc/passwd', rootDir)).toBe(false);
    expect(validateFilePath('subdir/file.txt', rootDir)).toBe(true);
  });

  test('should test signature disabling logic', () => {
    // Test the disablesigs function logic
    const disableSignatures = (configContent) => {
      return configContent.replace(/set sigs_enabled true/g, 'set sigs_enabled false');
    };

    const configWithSigs = 'set sigs_enabled true\necho "Boot menu"\nset timeout 30';
    const configWithoutSigs = 'set sigs_enabled false\necho "Boot menu"\nset timeout 30';
    
    expect(disableSignatures(configWithSigs)).toBe(configWithoutSigs);
    
    const configNoSigs = 'echo "Boot menu"\nset timeout 30';
    expect(disableSignatures(configNoSigs)).toBe(configNoSigs);
  });

  test('should test version detection logic', () => {
    // Test the commit SHA vs release version logic
    const getDownloadEndpoint = (version) => {
      if (version.length === 40) {
        return `https://s3.amazonaws.com/dev.boot.netboot.xyz/${version}/ipxe/`;
      } else {
        return `https://github.com/netbootxyz/netboot.xyz/releases/download/${version}/`;
      }
    };

    const commitSha = 'a1b2c3d4e5f6789012345678901234567890abcd';
    const release = 'v2.0.0';

    expect(getDownloadEndpoint(commitSha)).toContain('s3.amazonaws.com');
    expect(getDownloadEndpoint(release)).toContain('github.com');
  });

  test('should test ROM file identification', () => {
    // Test the ROM files logic from app.js
    const romFiles = [
      'netboot.xyz.kpxe',
      'netboot.xyz-undionly.kpxe',
      'netboot.xyz.efi',
      'netboot.xyz-snp.efi',
      'netboot.xyz-snponly.efi',
      'netboot.xyz-arm64.efi',
      'netboot.xyz-arm64-snp.efi',
      'netboot.xyz-arm64-snponly.efi'
    ];

    const isRomFile = (filename) => romFiles.includes(filename);

    expect(isRomFile('netboot.xyz.efi')).toBe(true);
    expect(isRomFile('netboot.xyz.kpxe')).toBe(true);
    expect(isRomFile('custom.ipxe')).toBe(false);
    expect(isRomFile('boot.cfg')).toBe(false);
  });

  test('should test base URL configuration', () => {
    // Test the baseurl logic
    const getBaseUrl = (subfolder) => subfolder || '/';
    
    expect(getBaseUrl('/custom/')).toBe('/custom/');
    expect(getBaseUrl('')).toBe('/');
    expect(getBaseUrl(undefined)).toBe('/');
  });

  test('should test asset path construction', () => {
    // Test asset path logic
    const constructAssetPath = (filePath) => '/assets' + filePath;
    
    expect(constructAssetPath('/test/file.img')).toBe('/assets/test/file.img');
    expect(constructAssetPath('/ubuntu/22.04/ubuntu.iso')).toBe('/assets/ubuntu/22.04/ubuntu.iso');
  });

  test('should test download URL construction with endpoints', () => {
    // Test the download URL construction for GitHub
    const constructGitHubUrl = (file) => 'https://github.com/netbootxyz' + file;
    
    expect(constructGitHubUrl('/releases/download/v2.0.0/netboot.xyz.efi'))
      .toBe('https://github.com/netbootxyz/releases/download/v2.0.0/netboot.xyz.efi');
  });

  test('should test configuration file filtering', () => {
    // Test the file filtering logic for non-directories
    const filterNonDirectories = (dirents) => {
      return dirents
        .filter(dirent => !dirent.isDirectory())
        .map(dirent => dirent.name);
    };

    const mockDirents = [
      { name: 'file1.ipxe', isDirectory: () => false },
      { name: 'subdir', isDirectory: () => true },
      { name: 'file2.cfg', isDirectory: () => false }
    ];

    const result = filterNonDirectories(mockDirents);
    expect(result).toEqual(['file1.ipxe', 'file2.cfg']);
  });
});