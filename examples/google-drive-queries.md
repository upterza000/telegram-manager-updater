# Google Drive Search Query Examples

This document provides various examples of Google Drive API search queries that can be used in the N8N workflow to find specific videos.

## Basic Video Queries

### All Videos
```
mimeType contains 'video/' and trashed = false
```

### Specific Video Formats
```
# MP4 files only
name contains '.mp4' and trashed = false

# Multiple formats
(name contains '.mp4' or name contains '.mov' or name contains '.avi') and trashed = false
```

## Folder-Based Searches

### Specific Folder
```
parents in 'FOLDER_ID_HERE' and mimeType contains 'video/' and trashed = false
```

### Multiple Folders
```
(parents in 'FOLDER_ID_1' or parents in 'FOLDER_ID_2') and mimeType contains 'video/'
```

### Exclude Specific Folders
```
mimeType contains 'video/' and not parents in 'FOLDER_ID_TO_EXCLUDE' and trashed = false
```

## File Size Filters

### Small Videos (under 10MB)
```
mimeType contains 'video/' and size < 10485760 and trashed = false
```

### Medium Videos (10MB - 50MB)
```
mimeType contains 'video/' and size > 10485760 and size < 52428800 and trashed = false
```

### Large Videos (over 50MB)
```
mimeType contains 'video/' and size > 52428800 and trashed = false
```

## Date-Based Filters

### Recently Modified (last 7 days)
```
mimeType contains 'video/' and modifiedTime > '2024-01-01T00:00:00' and trashed = false
```

### Created This Month
```
mimeType contains 'video/' and createdTime > '2024-01-01T00:00:00' and trashed = false
```

### Modified by Specific User
```
mimeType contains 'video/' and 'user@example.com' in writers and trashed = false
```

## Name-Based Searches

### Contains Specific Text
```
name contains 'meeting' and mimeType contains 'video/' and trashed = false
```

### Starts With Prefix
```
name contains 'VID_' and mimeType contains 'video/' and trashed = false
```

### Exclude Certain Names
```
not name contains 'temp' and mimeType contains 'video/' and trashed = false
```

## Advanced Combinations

### Recent Large Videos in Specific Folder
```
parents in 'FOLDER_ID' and mimeType contains 'video/' and size > 52428800 and modifiedTime > '2024-01-01T00:00:00' and trashed = false
```

### Videos Modified by Owner Only
```
mimeType contains 'video/' and 'me' in owners and trashed = false
```

### Shared Videos
```
mimeType contains 'video/' and sharedWithMe = true and trashed = false
```

### Videos with Specific Properties
```
mimeType contains 'video/' and starred = true and trashed = false
```

## Query Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals | `name = 'video.mp4'` |
| `!=` | Not equals | `name != 'temp.mp4'` |
| `contains` | Contains text | `name contains 'meeting'` |
| `>`, `<`, `>=`, `<=` | Comparison | `size > 1024` |
| `in` | In list | `parents in 'folder_id'` |
| `and` | Logical AND | `name contains 'video' and size > 1024` |
| `or` | Logical OR | `name contains '.mp4' or name contains '.mov'` |
| `not` | Logical NOT | `not name contains 'temp'` |

## Field References

| Field | Description | Example Values |
|-------|-------------|----------------|
| `name` | File name | `'video.mp4'` |
| `mimeType` | MIME type | `'video/mp4'` |
| `parents` | Parent folder IDs | `'1A2B3C4D5E6F'` |
| `size` | File size in bytes | `1048576` (1MB) |
| `createdTime` | Creation date | `'2024-01-01T00:00:00'` |
| `modifiedTime` | Last modified | `'2024-01-01T00:00:00'` |
| `trashed` | In trash | `true` or `false` |
| `starred` | Starred | `true` or `false` |
| `sharedWithMe` | Shared with user | `true` or `false` |
| `owners` | File owners | `'user@example.com'` |
| `writers` | Can edit | `'user@example.com'` |

## Common Use Cases

### Daily Video Processing
```javascript
// Get today's videos
const today = new Date().toISOString().split('T')[0];
const query = `mimeType contains 'video/' and modifiedTime > '${today}T00:00:00' and trashed = false`;
```

### Batch Process Folder
```javascript
// Process all videos in a specific folder
const folderId = 'YOUR_FOLDER_ID';
const query = `parents in '${folderId}' and mimeType contains 'video/' and trashed = false`;
```

### Size-Limited Processing
```javascript
// Only process videos under Telegram's 50MB limit
const maxSize = 50 * 1024 * 1024; // 50MB in bytes
const query = `mimeType contains 'video/' and size < ${maxSize} and trashed = false`;
```

## Tips for Optimization

1. **Always include `trashed = false`** to exclude deleted files
2. **Use specific MIME types** when possible for better performance
3. **Limit by folder** when you don't need to search the entire drive
4. **Add size limits** to avoid processing files too large for Telegram
5. **Use date filters** for incremental processing
6. **Combine multiple conditions** with `and` for precise results

## Troubleshooting

### No Results Found
- Check folder permissions
- Verify folder ID is correct
- Ensure files aren't in trash
- Check MIME type filter

### Too Many Results
- Add more specific filters
- Limit by date range
- Restrict to specific folders
- Add size constraints

### Permission Denied
- Verify OAuth2 credentials have Drive access
- Check if folder is shared with your account
- Ensure proper scope in credentials configuration