# netboot.xyz webapp

[![Build Status](https://github.com/netbootxyz/webapp/workflows/build/badge.svg)](https://github.com/netbootxyz/webapp/actions/workflows/build.yml)
[![Test Coverage](https://codecov.io/gh/netbootxyz/webapp/branch/master/graph/badge.svg)](https://codecov.io/gh/netbootxyz/webapp)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A modern web interface for editing iPXE boot menus and managing local asset mirrors for the netboot.xyz ecosystem.

## ✨ Features

- **🔧 Menu Editor**: Visual interface for editing iPXE configuration files
- **📦 Asset Management**: Download and mirror boot assets locally for faster performance
- **🔄 Real-time Updates**: Live menu updates with WebSocket integration
- **📊 System Monitoring**: Track download progress and system status
- **🐳 Docker Integration**: Seamlessly integrated with [docker-netbootxyz](https://github.com/netbootxyz/docker-netbootxyz)

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** for development
- **Docker** for containerized deployment

### Development Setup

1. **Clone and setup**:
   ```bash
   git clone https://github.com/netbootxyz/webapp
   cd webapp
   npm install
   ```

2. **Run tests**:
   ```bash
   npm test              # Run unit tests
   npm run test:coverage # Run with coverage report
   npm run test:watch    # Watch mode for development
   ```

3. **Start development server**:
   ```bash
   npm start             # Start the webapp
   ```

### Building with Docker

```bash
git clone https://github.com/netbootxyz/webapp
cd webapp
git clone https://github.com/netbootxyz/docker-netbootxyz
docker build . -t netbootxyz-webapp
```

## 🐳 Docker Deployment

### Running the Webapp

```bash
docker run -d \
  --name=netbootxyz-webapp \
  -e MENU_VERSION=2.0.84             # optional: specify menu version \
  -p 3000:3000                       # webapp interface \
  -p 69:69/udp                       # TFTP server \
  -p 8080:80                         # NGINX asset server \
  -v /local/path/to/config:/config   # optional: persistent config \
  -v /local/path/to/assets:/assets   # optional: asset cache \
  --restart unless-stopped \
  netbootxyz-webapp
```

### Port Configuration

| Port | Service | Description |
|------|---------|-------------|
| `3000` | **Webapp** | Main web interface for menu editing |
| `8080` | **NGINX** | Static asset hosting and download cache |
| `69/udp` | **TFTP** | Serves iPXE boot files to network clients |

### Development Builds

For the latest development version with cutting-edge features:

```bash
docker run -d \
  --name=netbootxyz-webapp-dev \
  -e MENU_VERSION=2.0.84             # optional: specify menu version \
  -p 3000:3000                       # webapp interface \
  -p 69:69/udp                       # TFTP server \
  -p 8080:80                         # NGINX asset server \
  -v /local/path/to/config:/config   # optional: persistent config \
  -v /local/path/to/assets:/assets   # optional: asset cache \
  --restart unless-stopped \
  ghcr.io/netbootxyz/webapp-dev:latest
```

## 🧪 Testing

The webapp includes comprehensive test coverage (90%+ coverage):

```bash
# Available test commands
npm test                 # Run unit tests (fastest)
npm run test:all         # Run all tests including integration
npm run test:coverage    # Generate coverage report
npm run test:watch       # Watch mode for development
npm run test:integration # Integration tests only
npm run test:debug       # Debug mode with verbose output
```

### Test Results
- **62 test cases** covering core functionality
- **90% code coverage** with branch coverage
- **Sub-second test execution** for rapid development feedback

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| **Test Coverage** | 90% |
| **Test Suites** | 5 |
| **Total Tests** | 62 |
| **Node.js Version** | 18+ |
| **License** | Apache 2.0 |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `npm test`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📝 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [netboot.xyz](https://github.com/netbootxyz/netboot.xyz) - Main boot menu system
- [docker-netbootxyz](https://github.com/netbootxyz/docker-netbootxyz) - Docker container implementation  
- [netboot.xyz-docs](https://github.com/netbootxyz/netboot.xyz-docs) - Documentation site
