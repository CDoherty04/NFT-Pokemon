# Session Management Flow

This document describes the updated session management system where sessions are created with only one user initially, and a second user can join later using the session ID.

## Session States

- **`waiting`**: Session is created with only `user1`, waiting for `user2` to join
- **`active`**: Both users have joined the session and it's ready for gameplay

## API Endpoints

### 1. Create Session
**POST** `/api/sessions`

Creates a new session with only `user1`. The session starts in `waiting` status.

**Request Body:**
```json
{
  "user1": {
    "walletAddress": "0x1234567890abcdef",
    "image": "user1-pokemon.png",
    "attributes": "{\"type\": \"fire\", \"level\": 25}"
  }
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "sessionId": "session_1234567890_abc123def",
    "user1": { ... },
    "user2": null,
    "status": "waiting",
    "isActive": true
  }
}
```

### 2. Join Session
**PATCH** `/api/sessions`

Allows `user2` to join an existing session using the session ID.

**Request Body:**
```json
{
  "sessionId": "session_1234567890_abc123def",
  "user2": {
    "walletAddress": "0xfedcba0987654321",
    "image": "user2-pokemon.png",
    "attributes": "{\"type\": \"water\", \"level\": 30}"
  }
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "sessionId": "session_1234567890_abc123def",
    "user1": { ... },
    "user2": { ... },
    "status": "active",
    "isActive": true
  }
}
```

### 3. Get Sessions
**GET** `/api/sessions`

Get all sessions or filter by type.

**Query Parameters:**
- `type=waiting`: Get only sessions waiting for a second user
- `type=check&sessionId=<id>`: Check if a specific session is available for joining

**Examples:**
- `GET /api/sessions` - Get all sessions
- `GET /api/sessions?type=waiting` - Get waiting sessions only
- `GET /api/sessions?type=check&sessionId=session_123` - Check session availability

### 4. Get Session by ID
**GET** `/api/sessions/[id]`

Get a specific session by its ID.

### 5. Update Session Status
**PUT** `/api/sessions/[id]`

Update the status of a session.

**Request Body:**
```json
{
  "status": "completed"
}
```

### 6. Delete Session
**DELETE** `/api/sessions/[id]`

Delete a session.

## Database Functions

### `createSession(user1, status = 'waiting')`
Creates a new session with only `user1`. The session starts in `waiting` status.

### `joinSession(sessionId, user2)`
Allows `user2` to join an existing session. The session status changes to `active`.

**Validation:**
- Session must exist
- Session must be active
- Session must be in `waiting` status
- Session must not already have `user2`
- `user2` cannot be the same as `user1`

### `isSessionAvailable(sessionId)`
Checks if a session is available for joining (waiting status, no user2, active).

### `getWaitingSessions()`
Returns all sessions that are waiting for a second user to join.

## Usage Examples

### Frontend Flow

1. **User1 creates a session:**
```javascript
const response = await fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user1: user1Data })
});
const { session } = await response.json();
// Share session.sessionId with User2
```

2. **User2 joins the session:**
```javascript
const response = await fetch('/api/sessions', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    sessionId: 'session_1234567890_abc123def',
    user2: user2Data 
  })
});
const { session } = await response.json();
// Session is now active with both users
```

3. **Check available sessions:**
```javascript
const response = await fetch('/api/sessions?type=waiting');
const { sessions } = await response.json();
// Display list of sessions waiting for players
```

## Error Handling

The API returns appropriate error messages for various scenarios:

- `Session not found`: Invalid session ID
- `Session is already full`: Session already has two users
- `Session is not active`: Session has been deactivated
- `Session is not available for joining`: Session is not in waiting status
- `User cannot join their own session`: User1 trying to join their own session

## Testing

Run the test script to verify the session flow:

```bash
node scripts/test-session-flow.js
```

This will demonstrate the complete flow from session creation to joining. 