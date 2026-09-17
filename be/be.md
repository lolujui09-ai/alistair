Baik. Kalau **AI usage/quota dihilangkan**, backend Alistair menjadi lebih sederhana.

## Struktur Backend Alistair

### 1. Backend Foundation

Fondasi server yang sudah kita mulai.

* Node.js + Express
* ES Module `.mjs`
* Environment configuration
* Koneksi MySQL
* Error handling dasar
* Struktur folder backend

---

### 2. Books API

Mengelola data buku dan komik.

* Daftar buku/komik
* Detail buku/komik
* Tambah data
* Edit data
* Hapus data
* Validasi data

Endpoint utama:

```text
GET    /api/books
GET    /api/books/:id
POST   /api/books
PUT    /api/books/:id
DELETE /api/books/:id
```

Database:

```text
books
```

---

### 3. User & Authentication

Mengelola pengguna aplikasi.

* Register
* Login
* Logout
* Authentication
* User profile
* Middleware authentication

Database:

```text
users
```

---

### 4. Chat System

Mengelola percakapan pengguna dengan Alistair.

* Membuat chat session
* Mengirim pesan
* Menyimpan pesan
* Mengambil riwayat percakapan
* Menghapus session jika diperlukan

Database:

```text
chat_sessions
chat_messages
```

Alurnya:

```text
User
 ↓
Chat API
 ↓
Alistair
 ↓
Response
 ↓
Simpan conversation
```

---

### 5. Library / Bookmark

Fitur untuk menyimpan buku atau komik yang disukai pengguna.

* Menambahkan buku ke library
* Menghapus dari library
* Melihat library
* Mengecek apakah buku sudah disimpan

Database:

```text
bookmarks
```

Relasinya:

```text
users
  │
  └── bookmarks
          │
          └── books
```

---

### 6. RAG & AI Integration

Ini bagian AI Alistair.

* Embedding query pengguna
* Semantic search ke Qdrant
* Mengambil buku yang relevan
* Membuat context
* Mengirim context ke LLM
* Membentuk respons Alistair

Alurnya:

```text
User
 ↓
Chat API
 ↓
Embedding
 ↓
Qdrant
 ↓
Relevant Books
 ↓
Context
 ↓
LLM
 ↓
Alistair Response
```

Database/vector storage:

```text
Qdrant
```

---

### 7. Testing & Security

Setelah fitur utama selesai:

* API testing
* Request validation
* Authentication security
* Password hashing
* Error handling
* Environment secrets
* CORS
* Rate limiting jika diperlukan

---

### 8. Production

Terakhir:

```text
MySQL Local
     ↓
TiDB Cloud
```

Kemudian:

```text
Backend
   ↓
Deploy VPS / Cloud
```

---

## Jadi database akhirnya

### MySQL / TiDB

```text
users
books
chat_sessions
chat_messages
bookmarks
```

### Qdrant

```text
books collection
```

Tidak ada:

```text
❌ ai_usage
❌ quota system
❌ BYOK system
```

Dan untuk urutan pengerjaan kita sekarang:

```text
1. Backend Foundation       ✅
2. Books API                ← sekarang
3. Validation & Error
4. User & Authentication
5. Chat System
6. Library / Bookmark
7. RAG & AI Integration
8. Testing & Security
9. Production / Deployment
```

**Dataset processing dan embedding belum dikerjakan sekarang.** Kita selesaikan backend aplikasi dasarnya dulu.
