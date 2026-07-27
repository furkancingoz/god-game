# God Game (MVP)

Godus / Populous / Black & White'tan ilham alan, tarayıcıda çalışan bir top-down god-game prototipi. Three.js ile yazıldı.

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini aç.

## Kontroller

- **Sol tık + sürükle:** Sahnede döndür (kamera) / Arazi üzerinde araziyi yükselt.
- **Shift + sol tık + sürükle:** Araziyi alçalt.
- **Sağ tık + sürükle:** Kaydır (pan).
- **Fare tekerleği:** Yakınlaş / uzaklaş.
- **R tuşu, ardından tıkla:** Tanrı elinin bulunduğu noktaya yağmur mucizesi çağır.

## Test

```bash
npm test        # birim testleri (Vitest)
```

## Kapsam ve Mimari

Kapsam ve detaylı mimari tasarım için `docs/superpowers/specs/2026-07-27-god-game-design.md` dokümanına başvurabilirsiniz.
