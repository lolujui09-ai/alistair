# Blueprint & Planning Implementasi RAG Alistair

Dokumen perencanaan teknis integrasi sistem **Retrieval-Augmented Generation (RAG)** pada backend Alistair dengan teknologi:
* **Embedding Model**: `all-MiniLM-L6-v2` (Berjalan 100% lokal di Node.js, 384 dimensi, Cosine distance)
* **Vector Database**: `Qdrant` (Collection: `books`, port: 6333)
* **LLM**: `Cloudflare Workers AI` (Model: `@cf/meta/llama-3.1-8b-instruct`)
* **Sumber Data**: `books_embed.txt` (~44.9 MB, berisi 89.014 judul buku/komik yang sudah terformat siap embed)

---

## 1. Arsitektur Sistem RAG

```
Pengguna (Chat UI di Frontend)
       │
       │ "Rekomendasikan manhwa santai berlatar pedesaan"
       ▼
[POST /api/chat] (Express.js Backend)
       │
       ├─► 1. Local Embedding Service (all-MiniLM-L6-v2)
       │      Konversi teks query user -> 384-dim Float32 vector (~20ms)
       │
       ├─► 2. Qdrant Vector Search
       │      Cari Top-5 buku paling relevan menggunakan Cosine Similarity (<10ms)
       │
       ├─► 3. RAG Context Builder
       │      Ekstrak metadata Top-5 buku (Judul, Penulis, Genre, Sinopsis, ID) ke format prompt
       │
       ├─► 4. Cloudflare Workers AI (LLM)
       │      System Prompt Alistair + Context Buku + Pertanyaan User -> Jawaban Natural Alistair
       │
       └─► 5. HTTP JSON Response
              Kembalikan teks Alistair + array objek buku (untuk kartu BookCard di UI)
```

---

## 2. Analisis Sumber Data (`books_embed.txt`)

File sumber data berada di root workspace: `books_embed.txt` (Ukuran: ~44.9 MB, 589.210 baris).

### Struktur Blok Tiap Buku:
Setiap buku dipisahkan oleh satu baris kosong (`\n\n`) dengan format persis:
```text
[Title]
Author: [Author]
Type: [Type]
Genre: [Genre]
Description: [Description]
Cover: [Cover URL]
```

### Pemetaan ID Buku ke Database MySQL:
Urutan blok buku di `books_embed.txt` berkorespondensi 1-ke-1 dengan `PRIMARY KEY id` pada tabel MySQL `books`:
* Blok ke-1 = `id: 1` (`!`)
* Blok ke-2 = `id: 2` (`!Khchange!`)
* Blok ke-N = `id: N`

### Keunggulan Menggunakan `books_embed.txt` untuk Tahap Ingestion:
1. **Bebas Beban Database**: Tidak perlu melakukan query database `SELECT *` yang berat terhadap 89.000 baris.
2. **Streaming Read Cepat**: Dibaca langsung menggunakan stream Node.js (`fs.createReadStream` + `readline`), sangat hemat memori RAM.
3. **Data Sudah Bersih**: Teks sinopsis, genre, dan cover sudah diformat per label, siap dikonversi menjadi teks embedding dan payload Qdrant.

---

## 3. Spesifikasi Komponen Teknologi

| Komponen | Pilihan Teknologi | Keterangan & Konfigurasi |
| :--- | :--- | :--- |
| **Data Source** | `books_embed.txt` | 89.014 blok data terstruktur, pembagian batch per 50-100 buku. |
| **Embedding Engine** | `@xenova/transformers` (Local ONNX) | Model: `Xenova/all-MiniLM-L6-v2`<br>• Vektor: **384 dimensi**.<br>• 100% lokal tanpa API key eksternal & tanpa perlu Python.<br>• Cepat (~15-30ms per query di CPU). |
| **Vector Database** | `Qdrant` | Client: `@qdrant/js-client-rest`<br>• Collection name: `books`<br>• Vector size: `384`<br>• Distance: `Cosine`<br>• Payload: `book_id`, `title`, `author`, `type`, `genre`, `cover_url`, `description`. |
| **LLM Provider** | `Cloudflare Workers AI` | Model: `@cf/meta/llama-3.1-8b-instruct`<br>• REST API Cloudflare AI.<br>• Biaya hemat / kuota gratis harian memadai, latensi sangat cepat.<br>• Respons bahasa Indonesia yang natural dan ramah. |

---

## 4. Tahapan Pengerjaan (Step-by-Step Roadmap)

### Tahap 1: Setup Environment & Dependensi
1. **Instalasi library pendukung di folder `be`:**
   ```bash
   npm install @qdrant/js-client-rest @xenova/transformers
   ```
2. **Konfigurasi Environment Variable (`be/.env`):**
   ```env
   # Qdrant Configuration
   QDRANT_URL=http://localhost:6333
   QDRANT_API_KEY=

   # Cloudflare Workers AI
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   CLOUDFLARE_API_TOKEN=your_api_token
   CLOUDFLARE_MODEL=@cf/meta/llama-3.1-8b-instruct
   ```
3. **Menjalankan Qdrant:**
   * Via Docker:
     ```bash
     docker run -d -p 6333:6333 -p 6334:6334 -v qdrant_storage:/qdrant/storage qdrant/qdrant
     ```
   * Atau menggunakan instance Qdrant Cloud (Managed Cluster gratis).

---

### Tahap 2: Local Embedding Service (`be/src/services/embedding.service.mjs`)
1. Inisialisasi pipeline model `Xenova/all-MiniLM-L6-v2` menggunakan arsitektur Singleton (model hanya di-load 1x ke memori saat startup).
2. Menyediakan 2 fungsi:
   * `getEmbedding(text)`: Menghasilkan 1 array vektor 384 dimensi untuk query pengguna.
   * `getBatchEmbeddings(texts[])`: Menghasilkan array vektor untuk batch ingestion buku.
3. Fungsi normalisasi vektor otomatis untuk memastikan metrik Cosine similarity bekerja optimal.

---

### Tahap 3: Qdrant Client & Inisialisasi Koleksi (`be/src/services/qdrant.service.mjs`)
1. Setup client `@qdrant/js-client-rest` terhubung ke `QDRANT_URL`.
2. Fungsi `initBooksCollection()`:
   * Cek apakah koleksi `books` sudah ada.
   * Jika belum ada, buat koleksi:
     ```javascript
     await qdrant.createCollection('books', {
       vectors: {
         size: 384,
         distance: 'Cosine'
       }
     });
     ```
   * Buat payload index pada field `type` dan `genre` untuk mendukung filtering gabungan (hybrid search) jika diinginkan.

---

### Tahap 4: Script Ingestion Data dari `books_embed.txt` ke Qdrant (`be/src/scripts/ingest_from_txt.mjs`)
Script mandiri untuk memproses file `books_embed.txt` ke Qdrant:
1. **Parser File TXT:**
   * Membaca `books_embed.txt` baris demi baris menggunakan `readline`.
   * Mengelompokkan setiap 6 baris menjadi satu objek buku:
     ```javascript
     {
       id: currentBookId, // incremental mulai dari 1
       title: lines[0],
       author: lines[1].replace('Author: ', ''),
       type: lines[2].replace('Type: ', ''),
       genre: lines[3].replace('Genre: ', ''),
       description: lines[4].replace('Description: ', ''),
       cover_url: lines[5].replace('Cover: ', '')
     }
     ```
2. **Format Teks Embedding yang Dibuat:**
   ```text
   Title: [title]. Type: [type]. Genre: [genre]. Synopsis: [description]
   ```
3. **Batching & Upsert:**
   * Kumpulkan per batch (50 atau 100 buku).
   * Jalankan `getBatchEmbeddings()` untuk batch tersebut.
   * Buat array points Qdrant:
     ```javascript
     {
       id: book.id,
       vector: embeddingVector,
       payload: {
         book_id: book.id,
         title: book.title,
         author: book.author,
         type: book.type,
         genre: book.genre,
         cover_url: book.cover_url,
         description: book.description.slice(0, 600)
       }
     }
     ```
   * Eksekusi `qdrant.upsert('books', { points })`.
4. **Checkpoint & Progress Tracking:**
   * Simpan checkpoint nomor `last_id` ke file `ingest_checkpoint.json`.
   * Jika proses terputus (misal terminal tertutup atau laptop sleep), script dapat dilanjutkan dari ID terakhir tanpa mengulang dari awal.
   * Cetak progress persentase dan estimasi sisa waktu di konsol.

---

### Tahap 5: Pengujian Semantic Search Independen (`be/src/scripts/test_search.mjs`)
Sebelum menyambungkan ke LLM, pastikan hasil pencarian vektor akurat dan relevan:
1. Menguji variasi query user, misalnya:
   * *"manhwa santai tema pedesaan atau kehidupan santai"*
   * *"reinkarnasi penjahat wanita di dunia game bangsawan"*
   * *"dungeon monster leveling system hunter terkuat"*
2. Mengambil Top-5 hasil dari Qdrant:
   ```javascript
   const searchResults = await qdrant.search('books', {
     vector: queryEmbedding,
     limit: 5,
     with_payload: true
   });
   ```
3. Memeriksa similarity score (biasanya > 0.60 untuk hasil yang sangat relevan) dan memvalidasi judul yang muncul.

---

### Tahap 6: LLM Service Cloudflare Workers AI (`be/src/services/llm.service.mjs`)
1. Implementasi pemanggilan REST API ke Cloudflare Workers AI:
   * Endpoint: `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${CLOUDFLARE_MODEL}`
   * Headers: `Authorization: Bearer ${CLOUDFLARE_API_TOKEN}`
2. Penanganan parameter: `temperature: 0.7`, `max_tokens: 1024`.
3. Error handling jika batas rate limit Cloudflare tercapai atau kendala jaringan.

---

### Tahap 7: RAG Orchestrator Service (`be/src/services/rag.service.mjs`)
Menyatukan alur pencarian vektor dan inferensi LLM:
1. Mengonversi pesan user menjadi embedding query.
2. Mengambil 5 buku paling relevan dari Qdrant.
3. Menyusun blok konteks buku:
   ```text
   [REKOMENDASI BUKU TERKAIT]:
   1. Judul: [Title] (ID: [book_id])
      Kategori: [Type] | Genre: [Genre]
      Sinopsis: [Description]
   ...
   ```
4. Mengirimkan System Prompt Alistair + Konteks Buku + Pertanyaan User + Riwayat Obrolan ke Cloudflare Workers AI.
5. Mengembalikan hasil berupa teks jawaban ramah + array objek buku (lengkap dengan `id`, `title`, `author`, `cover_url`, `genre`) agar frontend bisa langsung merender kartu buku.

---

### Tahap 8: Endpoint Chat API (`POST /api/chat`)
1. **File Controller & Route:**
   * `be/src/controllers/chat.controller.mjs`
   * `be/src/routes/chat.routes.mjs`
2. **Kontrak Request:**
   ```json
   {
     "message": "Cari manhwa fantasi dengan sistem leveling yang seru",
     "attachedBook": null,
     "history": [
       { "sender": "user", "text": "Halo Alistair" },
       { "sender": "alistair", "text": "Halo! Ada yang bisa kubantu carikan hari ini?" }
     ]
   }
   ```
3. **Kontrak Response (200 OK):**
   ```json
   {
     "success": true,
     "data": {
       "reply": "Tentu! Untuk cerita dengan sensasi leveling dan quest seru, berikut beberapa judul pilihan terbaik dari perpustakaan:",
       "books": [
         {
           "id": 2,
           "title": "!Khchange!",
           "author": "Unknown",
           "type": "Manga",
           "genre": "Collections, Comedy, Fantasy",
           "cover_url": "https://..."
         }
       ]
     }
   }
   ```

---

### Tahap 9: Integrasi ke Frontend (`fe`)
1. **Membuat Service Chat (`fe/src/services/chat.js`):**
   * Mengirimkan pesan ke `/api/chat`.
2. **Menyambungkan `sendMessage` di `fe/src/context/AppContext.jsx`:**
   * Saat user mengirim pesan, buat pesan user di UI.
   * Panggil `sendChatMessage()`.
   * Tampilkan jawaban AI dan lampirkan `data.books` ke objek pesan.
   * Komponen `ChatMessage.jsx` otomatis merender kartu `BookCard` interaktif yang bisa langsung diklik untuk melihat detail buku `/books/:id` atau disimpan ke Library.

---

## 5. System Prompt Persona Alistair

```text
Kamu adalah Alistair, seorang kurator buku dan penjaga perpustakaan virtual yang ramah, hangat, dan berpengetahuan luas tentang manga, manhwa, manhua, komik, dan novel.

ATURAN UTAMA:
1. Rekomendasikan buku berdasarkan informasi yang diberikan dalam bagian [KONTEKS BUKU].
2. Jelaskan alasan menarik mengapa buku tersebut cocok dengan keinginan atau suasana hati pengguna tanpa membocorkan alur cerita utama (spoiler-safe).
3. Jika informasi buku di konteks tidak sepenuhnya menjawab, katakan dengan jujur dan tawarkan opsi terdekat yang ada.
4. Jangan pernah mengarang judul buku atau fakta yang tidak ada di dalam katalog.
5. Gunakan bahasa Indonesia yang santun, luwes, dan bersahabat layaknya seorang pustakawan yang antusias berbagi cerita.
6. Kamu adalah pemandu bacaan, jangan pernah mengklaim menjual atau menyediakan unduhan file fisik/digital buku tersebut.
```

---

## 6. Checklist Verifikasi & Kriteria Keberhasilan

- [ ] **Data Reader:** Parser dapat membaca `books_embed.txt` secara streaming dan menghasilkan objek buku berurutan sesuai ID.
- [ ] **Embedding:** Model `all-MiniLM-L6-v2` berhasil memproduksi vektor 384 dimensi lokal di Node.js.
- [ ] **Qdrant Collection:** Koleksi `books` terbuat di Qdrant dengan konfigurasi dimensi 384 dan metrik Cosine.
- [ ] **Batch Ingestion:** Data buku dari `books_embed.txt` berhasil di-upsert ke Qdrant bertahap dengan fitur resume checkpoint.
- [ ] **Semantic Retrieval:** Pencarian semantik mengembalikan buku yang sangat relevan dengan pertanyaan tema atau suasana cerita.
- [ ] **Cloudflare LLM:** Cloudflare Workers AI merespons prompt konteks dengan cepat (< 2 detik) dan menghasilkan jawaban natural.
- [ ] **Endpoint `/api/chat`:** Berjalan normal dan mengembalikan format JSON `{ success: true, data: { reply, books } }`.
- [ ] **Frontend Chat:** Pengguna dapat mengobrol di tampilan chat dan melihat rekomendasi buku beserta kartu visualnya secara real-time.
