# 📚 Draw & Guess - Əlavə Resurslar və Kömək

## Xüsusi Texnologiyalar və Konseptlər

### 1. Canvas Drawing

- **HTML5 Canvas** - Çəkiliş API
- **Mouse Events** - mousedown, mousemove, mouseup
- **Drawing Tools** - Pen, colors, line width, eraser
- **Clear Canvas** - Canvas-ı təmizləmək

### 2. Game Logic

- **Word Bank** - Təsadüfi sözlər
- **Guess Matching** - Cavab yoxlanışı
- **Score System** - Düzgün təxminlər üçün bal
- **Timer** - Hər söz üçün vaxt limiti

## 🔗 Faydalı Linklər

### Canvas API

- [Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial) - **ÖNƏMLİ**
- [Canvas Drawing](https://www.w3schools.com/html/html5_canvas.asp)
- [Canvas Mouse Events](https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas)

### Drawing Logic

- [Canvas Drawing App](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes)
- [Line Drawing](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineTo)

## 💡 İpuçları

```javascript
// Canvas setup
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let isDrawing = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();

  [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

// Clear canvas
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
```

**⚠️ Qeyd:** Bu app ən çətin app-lardan biridir. Canvas API yenidir, ona görə addım-addım oxuyun.

## ❓ Tez-tez Verilən Suallar

**S: Canvas nədir?**  
C: HTML5 element-i, JavaScript ilə çəkiliş etməyə imkan verir. `<canvas>` tag-ı istifadə edin.

**S: Mouse koordinatları düzgün gəlmir?**  
C: `e.offsetX` və `e.offsetY` istifadə edin, canvas-ın relative koordinatlarını verir.

**S: Rəng və line width necə dəyişim?**  
C: `ctx.strokeStyle = 'red'` və `ctx.lineWidth = 5`

**S: Eraser necə işləyir?**  
C: Ağ rəng ilə çəkmək və ya `ctx.globalCompositeOperation = 'destination-out'`

**S: Oyun logikası nədir?**  
C: 1) Random söz seç, 2) İstifadəçi çəkir, 3) Digər oyunçu təxmin edir, 4) Cavab yoxla

Uğurlar! 🎨
