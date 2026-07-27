# Tanrı/Peygamber Oyunu — Tasarım Dokümanı

## Konsept

Godus / Populous / Black & White'tan ilham alan, top-down bir "god game". Oyuncu bir
tanrı (veya peygamber) rolünde, prosedürel bir ada üzerindeki takipçilerini gözetir:
araziyi şekillendirir, mucizeler kullanır, İnanç (Faith) biriktirerek yeni güçler ve
bina seviyeleri açar. Sabit bir "kazanma" koşulu yok — sandbox ilerleme.

Görsel yön: stilize, düşük-poli, "painterly" (Black & White / Godus estetiği).
Fotogerçekçilik hedeflenmiyor; hedef, türe uygun, WebGL'de gerçekten ulaşılabilir bir
üst düzey cila.

## Kapsam Stratejisi

Orijinal istek ("mükemmel, AAA, sonsuz /loop ile cilalama") sınırsız bir hedef. Bunun
yerine önce **oynanabilir bir MVP** kurulacak; MVP'nin nasıl hissettirdiğine göre
sonraki iterasyonlarda (görsel cilalama, ek mucizeler, harsh-critic /loop süreci) devam
edilecek. Bu doküman hem MVP kapsamını hem de MVP sonrası tam vizyonu tarif eder.

## MVP Kapsamı (v0 — şimdi inşa edilecek)

- Tek prosedürel ada: noise-tabanlı heightmap, sabit boyut (ör. 128x128), tek
  BufferGeometry mesh.
- Kamera: RTS-tarzı pan/zoom/rotate, top-down açı.
- Tanrı eli: fare ile raycast, arazi üzerinde görünür bir "el" imleci; sol tık ile
  yükselt, sağ tık (veya modifier) ile alçalt. Gerçek zamanlı mesh + normal güncellemesi.
- Takipçiler: 15-20 ajan, basit state machine (wander → gather → worship), grid-tabanlı
  hareket, InstancedMesh render. Karmaşık pathfinding yok (v0'da düz "hedefe doğru yürü,
  engelden kaçın" yeterli).
- Tek mucize: **Yağmur** — seçili alanda bitki/orman büyümesini tetikler, takipçi
  memnuniyetini artırır. (Terrain sculpting zaten temel "güç" olduğu için ayrı bir
  "Arazi Yükselt" mucizesi gerekmiyor — sculpting'in kendisi o rolü oynuyor.)
- İnanç sayacı: takipçiler ibadet ettikçe artar, basit HUD'da gösterilir. İlerleme
  katmanları (yeni mucize/bina kilidi) MVP'de yok — sayaç şimdilik gösterge amaçlı.
- Aydınlatma: tek yönlü güneş ışığı + ambient, sabit gündüz (gün-gece döngüsü yok).
  Basit MeshStandardMaterial'lar, ağır shader/post-processing yok.
- HUD: sadece İnanç ve Nüfus sayacı.

**MVP'de bilinçli olarak DIŞARIDA bırakılanlar:** yıkıcı mucizeler / ahlaki mekanik,
bina/yerleşim sistemi, gün-gece döngüsü, su shader'ı, post-processing stack, çoklu
mucize, ilerleme katmanları, ses. Bunlar MVP oynanabilir ve "doğru hissettiriyor" hale
geldikten sonra sırayla eklenecek.

## MVP Sonrası Tam Vizyon (yol haritası, şimdi inşa edilmeyecek)

1. Ek mucizeler: Sel/Alçalt, Güneş Işını, Kutsama, Yıldırım/Ateş (yıkıcı — aşırı
   kullanımda inanç cezası, ahlaki gerilim).
2. SettlementSystem: düz arazi + nüfus yoğunluğuna göre prosedürel bina yerleşimi,
   kulübe → köy → tapınak şehri katmanları.
3. FaithSystem: katman kilidi açma (yeni mucize/bina seviyesi).
4. RenderPipeline: gün-gece döngüsü, dinamik gökyüzü shader'ı, kıyı suyu shader'ı,
   post-processing (bloom, AO, tone mapping, vignette).
5. Görsel QA süreci: her sistem ayrı subagent'a dağıtılır, `/loop` içinde
   uygula → Playwright ile screenshot/video → ayrı bir "harsh critic" subagent
   (Black & White / Godus çıtasına göre acımasız değerlendirme) → 5 turda düzelmezse
   kullanıcıya eskale. Son entegrasyon subagent'ı bütünsel geçiş yapar.

## Teknik Mimari (MVP ve sonrası için ortak)

**Motor:** Vanilla Three.js, Vite ile build.

**Modüller (bağımsız, net arayüzlü):**
- `TerrainSystem` — heightmap (Float32Array), sculpt API (`raise/lower(x,z,radius,strength)`),
  `getHeightAt(x,z)` sorgusu.
- `CameraRig` — pan/zoom/rotate top-down kamera, raycast ile el konumu.
- `FollowerSystem` — state machine ajanlar, hareket, InstancedMesh render.
- `MiracleSystem` — güç tetikleme, VFX, dünya mutasyonu, takipçi tepkisi.
- `FaithSystem` — inanç puanı, (sonradan) katman kilidi.
- `GameState` — merkezi, gevşek bağlantı sağlayan paylaşılan durum; sistemler
  birbirine doğrudan değil, `GameState` üzerinden bağlanır.
- `UI/HUD` — DOM tabanlı, GameState'i okur.

**Veri akışı:** TerrainSystem tek gerçek kaynak (heightmap) → FollowerSystem ondan
yükseklik okur → MiracleSystem terrain/faith/follower'ları mutasyona uğratır → UI her
frame GameState okur.

**Hata yönetimi:** WebGL context kaybında graceful reload; follower/parçacık sayısına
performans üst sınırı; sculpt işlemleri ada sınırlarında clamp edilir; WebGL2 yoksa
düşük ayarlarla devam.

## Test Stratejisi

- MVP için: manuel tarayıcı testi (dev server + Playwright ile temel duman testi —
  sayfa yükleniyor mu, terrain render oluyor mu, tıklama sculpt tetikliyor mu).
- Birim testi hedefi düşük — bu bir görsel/etkileşimli prototip; asıl doğrulama görsel
  QA (yukarıda tarif edilen harsh-critic süreci) MVP sonrası aşamada devreye girer.
