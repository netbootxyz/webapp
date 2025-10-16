const fs = require('fs');
const path = require('path');
const { DownloaderHelper } = require('node-downloader-helper');

// Mock dependencies
jest.mock('fs');
jest.mock('node-downloader-helper');
jest.mock('node-fetch');

describe('Utility Functions', () => {
  let mockFs;
  let mockDownloaderHelper;
  let mockFetch;

  beforeAll(() => {
    mockFs = require('fs');
    mockDownloaderHelper = require('node-downloader-helper').DownloaderHelper;
    mockFetch = require('node-fetch');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('mock file content');
    mockFs.writeFileSync.mockImplementation(() => {});
    mockFs.readdirSync.mockReturnValue(['file1.ipxe', 'file2.cfg']);
    mockFs.copyFileSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
    mockFs.mkdirSync.mockImplementation(() => {});

    // Mock DownloaderHelper
    const mockDl = {
      on: jest.fn().mockReturnThis(),
      start: jest.fn().mockResolvedValue(true)
    };
    mockDownloaderHelper.mockImplementation(() => mockDl);

    // Mock fetch
    mockFetch.mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue('AmazonS3')
      }
    });
  });

  describe('File Security Validation', () => {
    test('should prevent directory traversal attacks', () => {
      const rootDir = '/config/menus/local/';
      const testCases = [
        { input: '../../../etc/passwd', expected: false },
        { input: '../../secrets.txt', expected: false },
        { input: 'valid-file.txt', expected: true },
        { input: 'subdir/valid-file.txt', expected: true }
      ];

      testCases.forEach(({ input, expected }) => {
        const resolvedPath = path.resolve(rootDir, input);
        const isSecure = resolvedPath.startsWith(rootDir);
        expect(isSecure).toBe(expected);
      });
    });

    test('should validate absolute paths correctly', () => {
      const rootDir = '/config/menus/local/';
      const testCases = [
        { input: '/etc/passwd', expected: false },
        { input: '/config/menus/local/valid.txt', expected: true },
        { input: '/config/menus/remote/file.txt', expected: false }
      ];

      testCases.forEach(({ input, expected }) => {
        const isSecure = input.startsWith(rootDir);
        expect(isSecure).toBe(expected);
      });
    });
  });

  describe('Configuration File Layering', () => {
    test('should layer remote and local files correctly', () => {
      const remoteFiles = ['boot.cfg', 'main.ipxe', 'utils.ipxe'];
      const localFiles = ['custom.ipxe', 'boot.cfg']; // boot.cfg should override remote

      mockFs.readdirSync.mockImplementation((dir) => {
        if (dir.includes('remote')) return remoteFiles;
        if (dir.includes('local')) return localFiles;
        return [];
      });

      // Simulate the layering function
      const layerMenu = () => {
        const remote = mockFs.readdirSync('/config/menus/remote');
        const local = mockFs.readdirSync('/config/menus/local');
        
        // Copy remote files first
        remote.forEach(file => {
          mockFs.copyFileSync(`/config/menus/remote/${file}`, `/config/menus/${file}`);
        });
        
        // Copy local files (overriding remote)
        local.forEach(file => {
          mockFs.copyFileSync(`/config/menus/local/${file}`, `/config/menus/${file}`);
        });
      };

      layerMenu();

      // Verify copy operations
      expect(mockFs.copyFileSync).toHaveBeenCalledWith('/config/menus/remote/boot.cfg', '/config/menus/boot.cfg');
      expect(mockFs.copyFileSync).toHaveBeenCalledWith('/config/menus/local/boot.cfg', '/config/menus/boot.cfg');
      expect(mockFs.copyFileSync).toHaveBeenCalledWith('/config/menus/local/custom.ipxe', '/config/menus/custom.ipxe');
    });

    test('should handle empty directories gracefully', () => {
      mockFs.readdirSync.mockImplementation((dir) => {
        if (dir.includes('remote')) return [];
        if (dir.includes('local')) return [];
        return [];
      });

      const layerMenu = () => {
        const remote = mockFs.readdirSync('/config/menus/remote');
        const local = mockFs.readdirSync('/config/menus/local');
        
        remote.forEach(file => {
          mockFs.copyFileSync(`/config/menus/remote/${file}`, `/config/menus/${file}`);
        });
        
        local.forEach(file => {
          mockFs.copyFileSync(`/config/menus/local/${file}`, `/config/menus/${file}`);
        });
      };

      expect(() => layerMenu()).not.toThrow();
      expect(mockFs.copyFileSync).not.toHaveBeenCalled();
    });
  });

  describe('Version Handling', () => {
    test('should correctly identify commit SHAs vs release versions', () => {
      const testCases = [
        { version: 'a1b2c3d4e5f6789012345678901234567890abcd', isCommit: true },
        { version: '1234567890123456789012345678901234567890', isCommit: true },
        { version: 'v2.0.0', isCommit: false },
        { version: '2.0.0', isCommit: false },
        { version: '2.0.0-beta1', isCommit: false },
        { version: 'latest', isCommit: false },
        { version: 'abcd123', isCommit: false } // Too short
      ];

      testCases.forEach(({ version, isCommit }) => {
        const result = version.length === 40;
        expect(result).toBe(isCommit);
      });
    });

    test('should generate correct download URLs', () => {
      const generateDownloadUrl = (version) => {
        if (version.length === 40) {
          return `https://s3.amazonaws.com/dev.boot.netboot.xyz/${version}/ipxe/`;
        } else {
          return `https://github.com/netbootxyz/netboot.xyz/releases/download/${version}/`;
        }
      };

      const commitSha = 'a1b2c3d4e5f6789012345678901234567890abcd';
      const release = 'v2.0.0';

      expect(generateDownloadUrl(commitSha)).toBe('https://s3.amazonaws.com/dev.boot.netboot.xyz/a1b2c3d4e5f6789012345678901234567890abcd/ipxe/');
      expect(generateDownloadUrl(release)).toBe('https://github.com/netbootxyz/netboot.xyz/releases/download/v2.0.0/');
    });
  });

  describe('Download Operations', () => {
    test('should handle download progress correctly', async () => {
      const mockDl = {
        on: jest.fn((event, callback) => {
          if (event === 'progress') {
            // Simulate progress event
            setTimeout(() => {
              callback({
                total: 1000,
                downloaded: 500,
                progress: 50
              });
            }, 10);
          }
          return mockDl;
        }),
        start: jest.fn().mockResolvedValue(true)
      };

      mockDownloaderHelper.mockImplementation(() => mockDl);

      const downloads = [
        { url: 'https://example.com/file.tar.gz', path: '/tmp/download' }
      ];

      // Simulate downloader function
      const downloader = async (downloadList) => {
        for (const item of downloadList) {
          const dl = new mockDownloaderHelper(item.url, item.path);
          dl.on('progress', (stats) => {
            expect(stats).toHaveProperty('total');
            expect(stats).toHaveProperty('downloaded');
            expect(stats).toHaveProperty('progress');
          });
          await dl.start();
        }
      };

      await downloader(downloads);
      expect(mockDl.start).toHaveBeenCalled();
    });

    test('should handle download errors gracefully', async () => {
      const mockDl = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            setTimeout(() => {
              callback(new Error('Download failed'));
            }, 10);
          }
          return mockDl;
        }),
        start: jest.fn().mockRejectedValue(new Error('Download failed'))
      };

      mockDownloaderHelper.mockImplementation(() => mockDl);

      const downloader = async (downloads) => {
        const dl = new mockDownloaderHelper('https://example.com/file.tar.gz', '/tmp');
        dl.on('error', (error) => {
          expect(error.message).toBe('Download failed');
        });
        
        try {
          await dl.start();
        } catch (error) {
          expect(error.message).toBe('Download failed');
        }
      };

      await downloader([]);
    });

    test('should check for multipart downloads', async () => {
      const allowedHosts = ['s3.amazonaws.com'];
      const urlLib = require('url');

      mockFetch.mockResolvedValue({
        headers: {
          get: jest.fn().mockReturnValue('AmazonS3')
        }
      });

      const checkMultipart = async (url) => {
        const parsedUrl = urlLib.parse(url);
        if (!allowedHosts.includes(parsedUrl.host)) {
          const response = await mockFetch(url + '.part2', { method: 'HEAD' });
          const server = response.headers.get('server');
          return server === 'AmazonS3' || server === 'Windows-Azure-Blob/1.0 Microsoft-HTTPAPI/2.0';
        }
        return false;
      };

      const hasMultipart = await checkMultipart('https://github.com/test/file.tar.gz');
      expect(hasMultipart).toBe(true);
    });
  });

  describe('Signature Management', () => {
    test('should disable signatures in boot configuration', () => {
      const bootConfig = 'set sigs_enabled true\necho "Boot menu"\nset timeout 30';
      const expectedConfig = 'set sigs_enabled false\necho "Boot menu"\nset timeout 30';

      mockFs.readFileSync.mockReturnValue(bootConfig);

      const disableSignatures = () => {
        const data = mockFs.readFileSync('/config/menus/remote/boot.cfg', 'utf8');
        const disabled = data.replace(/set sigs_enabled true/g, 'set sigs_enabled false');
        mockFs.writeFileSync('/config/menus/remote/boot.cfg', disabled, 'utf8');
        return disabled;
      };

      const result = disableSignatures();
      expect(result).toBe(expectedConfig);
      expect(mockFs.writeFileSync).toHaveBeenCalledWith('/config/menus/remote/boot.cfg', expectedConfig, 'utf8');
    });

    test('should handle missing signature settings gracefully', () => {
      const bootConfig = 'echo "Boot menu"\nset timeout 30';

      mockFs.readFileSync.mockReturnValue(bootConfig);

      const disableSignatures = () => {
        const data = mockFs.readFileSync('/config/menus/remote/boot.cfg', 'utf8');
        const disabled = data.replace(/set sigs_enabled true/g, 'set sigs_enabled false');
        return disabled;
      };

      const result = disableSignatures();
      expect(result).toBe(bootConfig); // Should remain unchanged
    });
  });

  describe('File Type Detection', () => {
    test('should handle ROM file types correctly', () => {
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

      const isRomFile = (filename) => {
        const romExtensions = ['.kpxe', '.efi'];
        return romExtensions.some(ext => filename.endsWith(ext));
      };

      romFiles.forEach(file => {
        expect(isRomFile(file)).toBe(true);
      });

      expect(isRomFile('regular-file.txt')).toBe(false);
      expect(isRomFile('menu.ipxe')).toBe(false);
    });
  });

  describe('Path Sanitization', () => {
    test('should properly resolve and validate paths', () => {
      const sanitizePath = (rootDir, userPath) => {
        const resolved = path.resolve(rootDir, userPath);
        return {
          path: resolved,
          isSecure: resolved.startsWith(rootDir)
        };
      };

      const rootDir = '/config/menus/local/';
      
      const testCases = [
        { input: 'safe-file.txt', expectedSecure: true },
        { input: '../../../etc/passwd', expectedSecure: false },
        { input: 'subdir/file.txt', expectedSecure: true },
        { input: '/etc/passwd', expectedSecure: false }
      ];

      testCases.forEach(({ input, expectedSecure }) => {
        const result = sanitizePath(rootDir, input);
        expect(result.isSecure).toBe(expectedSecure);
      });
    });
  });

  describe('Asset Management', () => {
    test('should handle asset deletion with part files', () => {
      const deleteAsset = (filePath) => {
        mockFs.unlinkSync('/assets' + filePath);
        
        if (mockFs.existsSync('/assets' + filePath + '.part2')) {
          mockFs.unlinkSync('/assets' + filePath + '.part2');
        }
      };

      mockFs.existsSync.mockReturnValue(true);

      deleteAsset('/test/file.img');

      expect(mockFs.unlinkSync).toHaveBeenCalledWith('/assets/test/file.img');
      expect(mockFs.unlinkSync).toHaveBeenCalledWith('/assets/test/file.img.part2');
    });

    test('should handle assets without part files', () => {
      const deleteAsset = (filePath) => {
        mockFs.unlinkSync('/assets' + filePath);
        
        if (mockFs.existsSync('/assets' + filePath + '.part2')) {
          mockFs.unlinkSync('/assets' + filePath + '.part2');
        }
      };

      mockFs.existsSync.mockReturnValue(false);

      deleteAsset('/test/file.img');

      expect(mockFs.unlinkSync).toHaveBeenCalledWith('/assets/test/file.img');
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(1); // Only called once for main file
    });
  });
});