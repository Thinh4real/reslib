# Format Rules - Complete Documentation

This is a comprehensive reference for all 15 Format validation rules. Due to size, this is extracted for easier reference.

## All Format Rules Summary

| Rule                 | String Format               | Parameters          | Primary Use                   |
| -------------------- | --------------------------- | ------------------- | ----------------------------- |
| `Email`              | ✅ `['Email']`              | `[options?]`        | Email addresses (RFC 5322)    |
| `Url`                | ✅ `['Url']`                | `[options?]`        | URLs with protocol            |
| `PhoneNumber`        | ✅ `['PhoneNumber']`        | `[options?]`        | Phone numbers (international) |
| `EmailOrPhoneNumber` | ✅ `['EmailOrPhoneNumber']` | `[options?]`        | Email OR phone                |
| `UUID`               | ✅ `['UUID']`               | `[version?]`        | UUIDs (v1-v5)                 |
| `MongoId`            | ✅ `['MongoId']`            | `[]`                | MongoDB ObjectIds             |
| `IP`                 | ✅ `['IP']`                 | `[4\|6?]`           | IP addresses                  |
| `MACAddress`         | ✅ `['MACAddress']`         | `[options?]`        | MAC addresses                 |
| `CreditCard`         | ✅ `['CreditCard']`         | `[]`                | Credit card numbers           |
| `HexColor`           | ✅ `['HexColor']`           | `[]`                | Hex color codes               |
| `Hexadecimal`        | ✅ `['Hexadecimal']`        | `[]`                | Hex strings                   |
| `Base64`             | ✅ `['Base64']`             | `[]`                | Base64 encoded                |
| `JSON`               | ✅ `['JSON']`               | `[]`                | JSON strings                  |
| `FileName`           | ✅ `['FileName']`           | `[]`                | Safe filenames                |
| `Matches`            | ❌ (object only)            | `[pattern, flags?]` | Custom regex                  |

---

## Quick Start Examples

```typescript
// Contact validation
class Contact {
  @IsEmail() email: string;
  @IsPhoneNumber() phone: string;
  @IsEmailOrPhoneNumber() flexible: string;
}

// Identifiers
class IDs {
  @IsUUID() id: string;
  @IsMongoId() docId: string;
  @Matches(/^[A-Z]{3}-\d{4}$/) code: string;
}

// Network
class Network {
  @IsUrl() website: string;
  @IsIP() serverIP: string;
  @IsMACAddress() deviceMAC: string;
}

// Data formats
class Data {
  @IsHexColor() color: string;
  @IsBase64() encoded: string;
  @IsJSON() config: string;
}
```

This reference covers all format validators comprehensively in the main documentation file.
