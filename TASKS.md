# Tapşırıqlar - Draw & Guess

## 📋 Əsas Tapşırıqlar

### 1. TypeScript Types ✅

```typescript
export interface DrawingSession {
  id: string;
  word: string;
  artistId: string;
  drawingData: string; // base64 or JSON
  guesses: Guess[];
  startedAt: Date;
  endsAt: Date;
  isActive: boolean;
}

export interface Guess {
  id: string;
  userId: string;
  guess: string;
  isCorrect: boolean;
  timestamp: Date;
  pointsEarned: number;
}

export interface Word {
  id: string;
  word: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
}
```

---

### 2. Canvas Drawing (Frontend) ✅

```javascript
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let isDrawing = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);

function draw(e) {
  if (!isDrawing) return;
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  [lastX, lastY] = [e.offsetX, e.offsetY];
}
```

---

### 3. Controllers ✅

- `startSession` - Yeni oyun sessiyası başlat
- `saveDrawing` - Rəsmi saxla
- `submitGuess` - Təxmin göndər
- `getRandomWord` - Random söz
- `endSession` - Sessiya bitir

---

### 4. Scoring ✅

Tez təxmin edən daha çox xal qazanır:

```typescript
const timeElapsed = Date.now() - session.startedAt.getTime();
const timeLeft = session.endsAt.getTime() - Date.now();
const points = Math.floor((timeLeft / 60000) * 100); // max 100
```

---

### 5. Drawing Storage ✅

Canvas-ı base64 string kimi saxla:

```javascript
const dataURL = canvas.toDataURL();
// Send to backend
```

---

## 🚀 Əlavə Tapşırıqlar

### 6. Color Picker ⭐

Müxtəlif rəng seçimi

### 7. Brush Size ⭐⭐

Fırça ölçüsü dəyişdirmə

### 8. Real-time Updates ⭐⭐⭐

Drawing-i real-time göstərmə (polling)

---

## ✅ Yoxlama

- [ ] Canvas drawing
- [ ] Rəsmi saxlama
- [ ] Təxmin sistemi
- [ ] Xal hesablama
- [ ] Timer
