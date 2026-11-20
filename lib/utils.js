// Extracted utility functions for better testability

/**
 * Disable signatures in boot configuration
 */
function disableSignatures(configContent) {
  return configContent.replace(/set sigs_enabled true/g, 'set sigs_enabled false');
}

/**
 * Validate port number
 */
function validatePort(port, defaultPort = 3000) {
  const portNum = Number(port);
  if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
    return defaultPort;
  }
  return portNum;
}

/**
 * Check if version is a commit SHA
 */
function isCommitSha(version) {
  return version.length === 40 && /^[a-f0-9]+$/i.test(version);
}

/**
 * Generate download URL based on version type
 */
function getDownloadUrl(version, file = '') {
  const baseUrl = isCommitSha(version)
    ? `https://s3.amazonaws.com/dev.boot.netboot.xyz/${version}/ipxe/`
    : `https://github.com/netbootxyz/netboot.xyz/releases/download/${version}/`;
  return baseUrl + file;
}

/**
 * Validate file path for security
 */
function validateFilePath(userPath, rootDir) {
  try {
    const path = require('path');
    const resolved = path.resolve(rootDir, userPath);
    const rootWithSeparator = path.resolve(rootDir) + path.sep;
    return {
      path: resolved,
      isSecure: resolved.startsWith(rootWithSeparator)
    };
  } catch {
    return { path: null, isSecure: false };
  }
}

/**
 * Check if host is allowed for downloads
 */
function isAllowedHost(url, allowedHosts = ['s3.amazonaws.com']) {
  try {
    const urlLib = require('url');
    const parsedUrl = urlLib.parse(url);
    return allowedHosts.includes(parsedUrl.host);
  } catch {
    return false;
  }
}

/**
 * Maximum number of parts of a multipart asset
 */
const MAX_ASSET_PARTS = 99;

/**
 * Get the name of part n of a multipart asset.
 * Part 1 has no suffix. Part 2 and the parts after it end in .partN.
 */
function getPartName(file, n) {
  return file + '.part' + n;
}

/**
 * Check if a file name is part 2 or a later part of a multipart asset
 */
function isAssetPart(file) {
  return /\.part\d+$/.test(file);
}

/**
 * Find the URLs of the remote parts that follow part 1.
 * Send a HEAD request for .part2, .part3, and so on.
 * Stop at the first part that does not exist.
 */
async function findRemoteParts(url, fetchFn, maxParts = MAX_ASSET_PARTS) {
  const parts = [];
  for (let n = 2; n <= maxParts; n++) {
    const partUrl = getPartName(url, n);
    let response;
    try {
      response = await fetchFn(partUrl, { method: 'HEAD' });
    } catch {
      break;
    }
    if (!response.ok) {
      break;
    }
    parts.push(partUrl);
  }
  return parts;
}

/**
 * Find the local parts that follow part 1.
 * Stop at the first part that does not exist.
 */
function findLocalParts(file, existsFn, maxParts = MAX_ASSET_PARTS) {
  const parts = [];
  for (let n = 2; n <= maxParts; n++) {
    const partFile = getPartName(file, n);
    if (!existsFn(partFile)) {
      break;
    }
    parts.push(partFile);
  }
  return parts;
}

module.exports = {
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
};