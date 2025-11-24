# API Nümunələri - Draw & Guess

## Base URL: `http://localhost:3009/api`

---

## 🎨 Sessiya Başlatmaq

### POST /api/sessions/start

```json
{
  "artistId": "user-1"
}
```

**Response:**

```json
{
  "session": {
    "id": "session-1",
    "word": "ev",
    "endsAt": "2024-01-15T10:05:00.000Z"
  }
}
```

---

## 🎯 Təxmin Göndərmək

### POST /api/sessions/:id/guess

```json
{
  "userId": "user-2",
  "guess": "ev"
}
```

**Response:**

```json
{
  "isCorrect": true,
  "pointsEarned": 85,
  "correctWord": "ev"
}
```

Uğurlar! 🎨
