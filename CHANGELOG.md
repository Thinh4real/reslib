# reslib

A lightweight, production-ready TypeScript library for decorator-based resource management and application utilities. ResLib provides a modular framework for building scalable applications with features like authentication, internationalization, validation, session management, and observable patterns. Designed for flexibility, it works seamlessly across web, Node.js, React Native (including Expo), and server-side frameworks like NestJS, offering type safety, extensibility, and performance optimizations without platform-specific dependencies.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-24

### Added

#### Core Features

- **Resource Management**: Complete decorator-based resource management system with CRUD operations, authorization, and lifecycle hooks
- **Authentication Module**: User authentication with session management, permission checking, and secure storage
- **Internationalization**: Full i18n support with translation management, locale switching, and interpolation
- **Validation System**: Comprehensive validation with custom rules, decorators, and error handling
- **Utility Modules**: Extensive utility functions for dates, strings, objects, URIs, and more
- **Platform Detection**: Runtime environment detection for web, Node.js, React Native, and Electron
- **Observable Pattern**: Event-driven architecture with observable factories and subscription management
- **Input Formatting**: Phone number and date formatting with masking capabilities
- **Currency Handling**: Multi-currency support with formatting and parsing
- **Country Data**: Country information with flags, currencies, and phone number validation
- **Logging System**: Configurable logging with dynamic registration and metadata support

#### Production-Ready Features

- **Build System**: tsup-based build with TypeScript declarations and ESM/CJS outputs
- **Testing Infrastructure**: Jest setup with comprehensive test coverage
- **Documentation**: TypeDoc-generated API documentation
- **Release Management**: Automated versioning and publishing scripts
- **Cross-Platform Compatibility**: Works seamlessly across web, Node.js, React Native (Expo), and NestJS
- **Peer Dependencies**: Optimized bundle size with `google-libphonenumber` and `validator` as peer dependencies
- **Type Safety**: Full TypeScript support with strict typing and decorator metadata

#### Developer Experience

- **Modular Architecture**: Clean separation of concerns with barrel exports
- **Extensible Framework**: Plugin system for custom decorators and field types
- **Comprehensive APIs**: Intuitive APIs with auto-completion and type hints
- **Error Handling**: Robust error handling throughout all modules
- **Performance Optimizations**: Efficient algorithms and memory management

### Changed

- Refactored from `reslib` to standalone `reslib` package
- Updated package name, description, and metadata for independent distribution
- Migrated build dependencies and optimized for production use

### Deprecated

- None

### Removed

- HTTP client module (to be implemented separately if needed)
- Direct dependencies on `google-libphonenumber` and `validator` (now peer dependencies)

### Fixed

- None (initial release)

### Security

- Secure session storage with encryption
- Input validation and sanitization
- No known vulnerabilities in dependencies
