Kalau begitu malah lebih cocok. **Alistair tidak perlu landing page.** Kita buat sebagai aplikasi AI langsung, dengan pengalaman yang mirip ChatGPT, tetapi tetap punya identitas Alistair.

## Struktur UI Alistair

### 1. Main Chat

Ini menjadi halaman utama ketika membuka aplikasi.

```text
┌─────────────────────────────────────────────────────────────┐
│ ☰  Alistair                                      ○ Profile │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│ + New Chat   │          ✦ Hello, I'm Alistair               │
│              │                                              │
│ Recent       │     What are you in the mood to read?        │
│ ─────────    │                                              │
│ Fantasy...   │                                              │
│ Manhwa...    │                                              │
│ Relaxing...  │                                              │
│              │                                              │
│              │                                              │
│              │                                              │
│              │                                              │
│              ├──────────────────────────────────────────────┤
│              │  Ask Alistair anything...             ↑     │
└──────────────┴──────────────────────────────────────────────┘
```

Konsepnya:

* Sidebar seperti ChatGPT
* `New Chat`
* Riwayat percakapan
* Chat area
* Input message
* Profile/user menu

**Tidak ada hero section, navbar marketing, pricing page, dll.**

---

# 2. Sidebar

Sidebar menjadi navigasi utama.

```text
Alistair

+ New Chat

────────────

Chats
  ├─ Manhwa santai
  ├─ Fantasy recommendation
  └─ Buku untuk weekend

────────────

Explore
My Library

────────────

Settings
```

Kalau belum login:

```text
Login
```

Kalau sudah login:

```text
Profile
Logout
```

---

# 3. Chat

Tampilan percakapannya dibuat sangat sederhana.

```text
User
Aku ingin manhwa fantasy yang santai
dengan setting pedesaan.


Alistair
Tentu. Kalau kamu mencari suasana yang
lebih tenang dengan setting pedesaan,
aku punya beberapa pilihan...

[Book Card] [Book Card] [Book Card]


        ┌──────────────────────────────┐
        │ Ask something...          ↑ │
        └──────────────────────────────┘
```

Alistair bisa menampilkan **book card** di dalam response.

Misalnya:

```text
┌────────────────────────┐
│ [ COVER ]              │
│                        │
│ Frieren                │
│ Kanehito Yamada        │
│ Fantasy · Adventure    │
│                        │
│ View Book →            │
└────────────────────────┘
```

---

# 4. Explore

Tidak perlu halaman marketing.

Cukup katalog:

```text
Explore

[ Search books... ]

Genre: [All ▼]
Type:  [All ▼]

┌────────┐ ┌────────┐ ┌────────┐
│ Cover  │ │ Cover  │ │ Cover  │
│ Title  │ │ Title  │ │ Title  │
│ Author │ │ Author │ │ Author │
└────────┘ └────────┘ └────────┘
```

---

# 5. Book Detail

Tetap sederhana:

```text
← Back

[ COVER ]

Solo Leveling

Chugong

Manhwa
Fantasy · Action · Adventure

Description
────────────────────
...

[♡ Add to Library]

[ Ask Alistair about this ]
```

---

# 6. My Library

Hanya untuk user login.

```text
My Library

Saved Books

┌────────┐ ┌────────┐ ┌────────┐
│ Cover  │ │ Cover  │ │ Cover  │
│ Title  │ │ Title  │ │ Title  │
└────────┘ └────────┘ └────────┘
```

---

# 7. Login/Register

Minimal saja.

```text
        Alistair

     Welcome back

[ Email              ]

[ Password           ]

[      Login         ]

Don't have an account?
Register
```

Register juga sederhana.

---

# 8. Settings

Tidak perlu banyak.

```text
Settings

Appearance
  Theme: System / Light / Dark

Account
  Email
  Password

Chat
  Clear chat history
```

---

# Struktur halaman React

Jadi frontend cukup:

```text
src/
├── pages/
│   ├── Chat
│   ├── Explore
│   ├── BookDetail
│   ├── Library
│   ├── Login
│   ├── Register
│   └── Settings
│
├── components/
│   ├── Sidebar
│   ├── ChatMessage
│   ├── ChatInput
│   ├── BookCard
│   └── BookGrid
│
└── layouts/
    └── AppLayout
```

Dan semuanya menggunakan **DaisyUI + Tailwind**.

### Navigasi utamanya

```text
┌───────────────┐
│ + New Chat    │
│               │
│ Chat History  │
│               │
│ Explore       │
│ My Library    │
│               │
│ Settings      │
└───────────────┘
```

**Chat adalah pusat aplikasi**, bukan landing page.

Jadi ketika seseorang membuka Alistair, mereka langsung berhadapan dengan:

> **"What are you in the mood to read?"**

lalu bisa langsung mengetik. Ini juga membuat scope proyek jauh lebih kecil dan cocok dengan tujuanmu untuk fokus ke **RAG + backend + pengalaman chat**, bukan membuat website marketing.
