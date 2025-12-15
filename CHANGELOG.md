## 1.0.3 (2025-12-09)

## 1.1.1

### Patch Changes

- feat: add i18n module with enhanced I18n class, @Translate decorator, and related tests

## 1.1.0

### Minor Changes

- chore: add changeset configuration and update package.json dependencies
  - Added changeset commands to package.json for versioning and publishing.
  - Updated devDependencies:
    - Added @changesets/cli version 2.29.8.
    - Updated @types/node to version 24.10.2.
    - Updated @typescript-eslint/eslint-plugin and parser to version 8.49.0.
    - Updated prettier to version 3.7.4.
    - Updated ts-jest to version 29.4.6.
    - Updated typedoc to version 0.28.15.
  - Created a new changeset configuration file with default settings.

### Bug Fixes

- add missing commas in README examples for clarity ([2f6f749](https://github.com/boris-fouomene/reslib/commit/2f6f749c2d65d38b29e799ac16176893b8227df1))
- uncomment id property in AuthUser interface for clarity ([47c9227](https://github.com/boris-fouomene/reslib/commit/47c92277961995250d8fbc06da1b3bada265af05))
- update accessCode validation to use array syntax for OneOf decorator ([0b64808](https://github.com/boris-fouomene/reslib/commit/0b64808824a69d50b974577c0c0c7ac624486f85))
- Update IsEmail decorator to require parentheses for consistency ([1f356a4](https://github.com/boris-fouomene/reslib/commit/1f356a4eadb808a6f7ab47931ab32e67be3febc8))
- update module declaration paths in documentation comments ([6e9d2d8](https://github.com/boris-fouomene/reslib/commit/6e9d2d8119d057da40077aed1c35f891a02875ed))
- update session timestamp property name from authSessionCreatedAt to sessionCreatedAt ([da14aa2](https://github.com/boris-fouomene/reslib/commit/da14aa259d2b86d4f51eee93f92ad3d52b096575))

### Features

- add AttachAuthSecureStorage decorator for configurable secure storage implementations ([dba68eb](https://github.com/boris-fouomene/reslib/commit/dba68eb13872aae5001ff80e6cf45407c9bd7839))
- add ESLint configuration for TypeScript and improve pre-commit setup ([1cbc676](https://github.com/boris-fouomene/reslib/commit/1cbc676d5f25cd3f76d6fb4aceca67e861dde489))
- add ESLint, Prettier, Husky, and lint-staged for code quality ([31e9949](https://github.com/boris-fouomene/reslib/commit/31e9949fd14227b111a3dfaad2d13a8b8aa4c8c4))
- add isHexadecimal and isMongoId validation functions ([173cbf4](https://github.com/boris-fouomene/reslib/commit/173cbf467c145eb03831ea9dc01b091f598c0238))
- add secureStorage getter and setter for customizable authentication data storage ([4c87320](https://github.com/boris-fouomene/reslib/commit/4c87320ff39cf8a96d2042ed9478b24130a79e5b))
- enhance validation and utility functions ([da790c3](https://github.com/boris-fouomene/reslib/commit/da790c338d1cf067a84bb2ccb3311c5bb2639fd4))
- **image:** enhance isImageSrc function to support custom image extensions ([1dd74e1](https://github.com/boris-fouomene/reslib/commit/1dd74e14e3d047afc6bd5cef24323533633ea33f))
- implement AuthStorage interface for secure session management and update sessionCreatedAt property ([ad25b9c](https://github.com/boris-fouomene/reslib/commit/ad25b9c2468d6cc4c20871d8864b2b44d73ee4af))
- initial setup of reslib package with core modules and build system ([3670dad](https://github.com/boris-fouomene/reslib/commit/3670dadcebb14fe859fa109d4fdd4e948c278dda))
- update AuthUser interface to include email and username, and modify getKey method for improved session key generation ([c9f4505](https://github.com/boris-fouomene/reslib/commit/c9f450524187b0913f9e890304074d998c2b7267))
