# Validator Documentation Index

## 📚 Complete Documentation Structure

This directory contains comprehensive documentation for `reslib/validator`.

---

## 🚀 START HERE

### **[README.md](../README.md)** - Main Entry Point

**Your starting point for validator documentation**

- Quick start guide
- Feature overview
- Common patterns
- Links to all other documentation

👉 **Read this first!**

---

## 📖 Core Documentation

### **[GUIDE.md](./GUIDE.md)** - Complete User Guide

**Comprehensive guide with detailed explanations and examples** (~5,400 lines)

**Contents:**

- Core concepts and architecture
- All 67 validation rules (detailed documentation)
- Advanced usage patterns
- Custom rule development
- Decorator patterns
- TypeScript integration
- Best practices
- Troubleshooting

📌 **When to use:** Deep dive into features, learning advanced patterns

---

### **[RULES.md](./RULES.md)** - Validation Rules Reference

**Quick reference for all 67 validation rules** (~500 lines)

**Contents:**

- Organized by category (Default, String, Numeric, Date, Array, File, Format, Advanced)
- Quick lookup table
- Parameter specifications
- Basic usage examples
- Links to detailed guide

📌 **When to use:** Quick rule lookup, checking available validators

---

### **[API_REFERENCE.md](./API_REFERENCE.md)** - API Documentation

**Complete API reference for Validator class** (~500 lines)

**Contents:**

- `Validator.validate()` - detailed API
- `Validator.validateTarget()` - class validation
- `Validator.registerRule()` - custom rules
- All helper methods
- Type definitions
- Error handling

📌 **When to use:** API details, method signatures, type information

---

## 📎 Supplementary References

### **[\_FORMAT_REFERENCE.md](./_FORMAT_REFERENCE.md)** - Format Validators

Quick reference for 15 format validation rules (Email, URL, Phone, UUID, IP, MAC, etc.)

### **[\_ADVANCED_REFERENCE.md](./_ADVANCED_REFERENCE.md)** - Advanced Rules

Detailed docs for specialized rules (Enum, Object, OneOf, AllOf, ArrayOf, ValidateNested)

---

## 🗺️ Documentation Flow

```
START
  ↓
README.md ←―――――― You are here!
  ↓
  ├→ Quick Start? → Use examples in README
  ├→ Learn Rules? → Go to RULES.md
  ├→ API Details? → Go to API_REFERENCE.md
  └→ Deep Dive?   → Go to GUIDE.md
```

---

## 📋 Documentation by Use Case

### I want to...

| Goal                             | Document                               | Section            |
| -------------------------------- | -------------------------------------- | ------------------ |
| **Get started quickly**          | [README.md](../README.md)               | Quick Start        |
| **See all available rules**      | [RULES.md](./RULES.md)                 | All categories     |
| **Learn a specific rule**        | [GUIDE.md](./GUIDE.md)                 | Rule categories    |
| **Use decorators**               | [README.md](../README.md)               | Decorator examples |
| **Validate a class**             | [API_REFERENCE.md](./API_REFERENCE.md) | validateTarget()   |
| **Create custom rules**          | [GUIDE.md](./GUIDE.md)                 | Custom Rules       |
| **Check method signatures**      | [API_REFERENCE.md](./API_REFERENCE.md) | API Reference      |
| **See common patterns**          | [README.md](../README.md)               | Common Patterns    |
| **Troubleshoot issues**          | [GUIDE.md](./GUIDE.md)                 | Troubleshooting    |
| **Migrate from another library** | [GUIDE.md](./GUIDE.md)                 | Migration Guide    |

---

## 📦 Document Statistics

| Document                | Lines  | Size   | Purpose                   |
| ----------------------- | ------ | ------ | ------------------------- |
| README.md               | ~200   | 15 KB  | Entry point & quick start |
| GUIDE.md                | ~5,400 | 140 KB | Complete detailed guide   |
| RULES.md                | ~500   | 35 KB  | Rules quick reference     |
| API_REFERENCE.md        | ~500   | 35 KB  | API documentation         |
| \_FORMAT_REFERENCE.md   | ~100   | 8 KB   | Format rules helper       |
| \_ADVANCED_REFERENCE.md | ~100   | 8 KB   | Advanced rules helper     |

**Total:** ~6,800 lines of documentation

---

## 🔗 Cross-Reference Links

All documents are interconnected:

- **README.md** → Links to all other docs
- **GUIDE.md** → Comprehensive, references RULES and API
- **RULES.md** → Links back to GUIDE for details
- **API_REFERENCE.md** → Links to GUIDE and RULES

You can navigate freely between documents!

---

## ✅ Documentation Quality

- ✅ **100% Complete** - All 67 rules documented
- ✅ **Production-Ready** - Professional quality
- ✅ **Well-Structured** - Clear hierarchy
- ✅ **Interconnected** - Easy navigation
- ✅ **Searchable** - Clear section headers
- ✅ **Examples-Rich** - Code samples throughout
- ✅ **Type-Safe** - Full TypeScript documentation

---

## 🎯 Recommended Reading Order

### For Beginners:

1. **[README.md](../README.md)** - Overview and quick start
2. **[RULES.md](./RULES.md)** - See what's available
3. **[GUIDE.md](./GUIDE.md)** - Learn in detail

### For Experienced Developers:

1. **[README.md](../README.md)** - Quick overview
2. **[API_REFERENCE.md](./API_REFERENCE.md)** - API details
3. **[RULES.md](./RULES.md)** - Rule reference as needed

### For Migration:

1. **[README.md](./README.md#migration-guide)** - Migration overview
2. **[GUIDE.md](./GUIDE.md#migration-guide)** - Detailed migration
3. **[RULES.md](./RULES.md)** - Rule equivalents

---

Made with ❤️ by the reslib team
