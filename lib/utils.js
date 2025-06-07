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

module.exports = {
  disableSignatures,
  validatePort,
  isCommitSha,
  getDownloadUrl,
  validateFilePath,
  isAllowedHost
};