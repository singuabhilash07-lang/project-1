# Notifications Feature - UnLost Platform

## Overview
The notifications feature automatically alerts users when their reported items match with items reported by other users. For example, if User A reports a lost item and User B reports a found item with similar descriptions, User A will be notified when they log in.

## How It Works

### 1. **Item Matching Algorithm**
When a user logs in/verifies their OTP, the system:
- Retrieves all items reported by that user
- Compares their description and name against items reported by other users
- Looks for opposite type matches (lost items matched with found items)
- Calculates a match score using string similarity (difflib SequenceMatcher)
- Returns matches with score > 0.5 (50%) that haven't been claimed yet

### 2. **Notification Response**
When a user verifies their OTP, the `/api/user/verify` endpoint returns:

```json
{
  "message": "User verified",
  "user": {
    "email": "user@example.com",
    "name": "John",
    "verified": true
  },
  "notifications": [
    {
      "id": "Found Keys",
      "type": "found",
      "name": "Found Keys",
      "description": "Silver keys with blue keychain",
      "ownerEmail": "other@example.com",
      "matchScore": 87.5,
      "message": "Found match for your lost item 'Lost Keys': A found item 'Found Keys' was reported!"
    }
  ]
}
```

### 3. **Frontend Display**
- Notifications are shown in an alert dialog when the user logs in
- A **notification badge** appears in the navbar showing the count
- Users can click the bell icon to view all notifications
- Each notification shows:
  - Item name and type (lost/found)
  - Description
  - Match score percentage
  - Custom message

## API Endpoints

### `/api/user/verify` (POST)
**Enhanced Response with Notifications**

```bash
POST /api/user/verify
Content-Type: application/json
Body: { "email": "user@example.com", "otp": "123456" }
```

Returns notifications in response if matches found.

### `/api/notify/match` (POST) - Optional
Send manual notification to another user about a match:

```bash
POST /api/notify/match
Content-Type: application/json
Body: {
  "fromEmail": "finder@example.com",
  "toEmail": "loser@example.com",
  "itemName": "Lost iPhone",
  "message": "I think I found your item!"
}
```

## Configuration

The matching threshold can be adjusted in `backend/app.py`:
```python
if score > 0.5:  # Change 0.5 to adjust sensitivity (0.0-1.0)
    matches.append({...})
```

## Examples

### Scenario 1: Lost Keys Found
1. Alice reports: "Lost - Silver house keys with blue keychain"
2. Bob reports: "Found - Silver keys with blue keychain found near mall"
3. When Alice logs in → Gets notification of Bob's found item
4. When Bob logs in → Gets notification of Alice's lost item

### Scenario 2: No Match
- Carol reports: "Lost - Red umbrella"
- Dave reports: "Found - Blue backpack"
- No notifications (different items)

### Scenario 3: Already Claimed
- Emma reports: "Lost - Gold ring"
- Frank reports: "Found - Gold ring" (claimed=true)
- Frank's item won't generate notifications (already claimed)

## Testing

Test the feature with:
```powershell
# Create user 1 with lost item
# Create user 2 with found item (similar description)
# Login as user 1 → Should see notification
# Check browser console and backend logs for debug info
```

Backend logs show:
- `[Verify] Found X matches for email@example.com`
- `[Notification] Found match for your lost item '...': A found item '...' was reported!`

## Frontend Integration

### Updated Components:
- **RegisterModal.jsx**: Displays notifications in alert when user logs in
- **Navbar.jsx**: Shows notification badge with count and detailed notification menu

### Files Modified:
- `backend/app.py`: Added `find_matching_items()` function and `/api/notify/match` endpoint
- `frontend/src/components/RegisterModal.jsx`: Enhanced to display notifications
- `frontend/src/components/Navbar.jsx`: Added notification bell badge UI

## Future Enhancements

1. **Persistent Notifications**: Store in database for later viewing
2. **Email Notifications**: Send email when match is found (not just on login)
3. **Manual Contact**: Add messaging system for matched users
4. **Smart Dismissal**: Users can dismiss or mark notifications as read
5. **Notification History**: View past notifications in profile page
6. **Advanced Matching**: Consider category, location, date of loss
7. **Notification Preferences**: Let users customize match threshold

## Troubleshooting

**Q: Notifications not appearing?**
- Check backend logs: `docker-compose logs backend | grep "Found.*matches"`
- Verify items have opposite types (lost vs found)
- Ensure descriptions are similar enough (>50% match score)
- Check items aren't already claimed

**Q: Match score too high/low?**
- Adjust threshold in `app.py` line: `if score > 0.5:`
- Lower = more sensitive, higher = more strict

**Q: SMTP errors when sending email?**
- Email sending is non-blocking, notifications still work via API response
- Use `SHOW_OTP=true` in .env to display OTP in browser for testing
