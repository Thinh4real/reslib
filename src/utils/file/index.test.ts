import { getFileExtension } from '.';
// Jest test cases
describe('getFileExtension', () => {
  describe('basic functionality', () => {
    it('should extract extension with dot by default', () => {
      expect(getFileExtension('document.pdf')).toBe('.pdf');
      expect(getFileExtension('image.jpg')).toBe('.jpg');
      expect(getFileExtension('script.js')).toBe('.js');
    });

    it('should extract extension without dot when withoutDot is true', () => {
      expect(getFileExtension('document.pdf', { withoutDot: true })).toBe(
        'pdf'
      );
      expect(getFileExtension('image.jpg', { withoutDot: true })).toBe('jpg');
      expect(getFileExtension('script.js', { withoutDot: true })).toBe('js');
    });

    it('should handle multiple dots and return last extension', () => {
      expect(getFileExtension('archive.tar.gz')).toBe('.gz');
      expect(getFileExtension('backup.2023.12.31.sql')).toBe('.sql');
      expect(getFileExtension('config.dev.json')).toBe('.json');
    });
  });

  describe('file paths', () => {
    it('should work with absolute paths', () => {
      expect(getFileExtension('/home/user/documents/file.txt')).toBe('.txt');
      expect(getFileExtension('/var/log/system.log')).toBe('.log');
    });

    it('should work with relative paths', () => {
      expect(getFileExtension('./src/index.ts')).toBe('.ts');
      expect(getFileExtension('../assets/logo.png')).toBe('.png');
    });

    it('should work with Windows paths', () => {
      expect(getFileExtension('C:\\Users\\John\\file.docx')).toBe('.docx');
      expect(getFileExtension('D:\\Projects\\app.exe')).toBe('.exe');
    });
  });

  describe('edge cases', () => {
    it('should return empty string for files without extension', () => {
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('Dockerfile')).toBe('');
      expect(getFileExtension('makefile')).toBe('');
    });

    it('should return empty string for hidden files (starting with dot)', () => {
      expect(getFileExtension('.gitignore')).toBe('');
      expect(getFileExtension('.env')).toBe('');
      expect(getFileExtension('.htaccess')).toBe('');
    });

    it('should return empty string for files ending with dot', () => {
      expect(getFileExtension('file.')).toBe('');
      expect(getFileExtension('document.')).toBe('');
    });

    it('should handle empty and invalid inputs', () => {
      expect(getFileExtension('')).toBe('');
      expect(getFileExtension('   ')).toBe('');
      expect(getFileExtension(null as any)).toBe('');
      expect(getFileExtension(undefined as any)).toBe('');
    });

    it('should handle files with spaces in names', () => {
      expect(getFileExtension('my document.pdf')).toBe('.pdf');
      expect(getFileExtension('file with spaces.txt')).toBe('.txt');
    });

    it('should handle very long extensions', () => {
      expect(getFileExtension('file.verylongextension')).toBe(
        '.verylongextension'
      );
      expect(
        getFileExtension('file.verylongextension', { withoutDot: true })
      ).toBe('verylongextension');
    });
  });

  describe('case sensitivity', () => {
    it('should preserve case in extensions', () => {
      expect(getFileExtension('document.PDF')).toBe('.PDF');
      expect(getFileExtension('image.JPG')).toBe('.JPG');
      expect(getFileExtension('script.JS', { withoutDot: true })).toBe('JS');
    });
  });

  describe('special characters', () => {
    it('should handle files with special characters', () => {
      expect(getFileExtension('file-name.txt')).toBe('.txt');
      expect(getFileExtension('file_name.txt')).toBe('.txt');
      expect(getFileExtension('file@name.txt')).toBe('.txt');
      expect(getFileExtension('file#name.txt')).toBe('.txt');
    });
  });

  describe('options parameter', () => {
    it('should work with explicit withoutDot: false', () => {
      expect(getFileExtension('file.txt', { withoutDot: false })).toBe('.txt');
    });

    it('should work with explicit withoutDot: true', () => {
      expect(getFileExtension('file.txt', { withoutDot: true })).toBe('txt');
    });

    it('should work with empty options object', () => {
      expect(getFileExtension('file.txt', {})).toBe('.txt');
    });

    it('should work without options parameter', () => {
      expect(getFileExtension('file.txt')).toBe('.txt');
    });
  });
});
