# Desain Thinking Alistair: Solusi Praktis Mencari Bacaan

Dokumen ini menjelaskan perancangan aplikasi **Alistair** menggunakan pendekatan *Design Thinking*. Fokus utamanya adalah menyelesaikan masalah nyata yang sering dihadapi orang saat mencari bahan bacaan (komik, manga, manhwa, webtoon, maupun novel) dengan cara yang sederhana, cepat, dan tepat sasaran.

---

## 1. Masalah Nyata: Kenapa Alistair Dibutuhkan?

Pernahkah kamu ingin membaca sesuatu, tapi bingung mau membaca apa, lalu akhirnya menghabiskan waktu 30 sampai 60 menit hanya untuk *scrolling* katalog atau media sosial tanpa hasil?

Kondisi ini sangat umum dan sering disebut **"Reading Slump"** atau kelelahan memilih (*choice overload*). 
Meskipun ada jutaan bacaan di internet, menemukan yang benar-benar cocok dengan selera kita ternyata sulit karena beberapa kendala nyata:

1. **Mesin pencari biasa terlalu kaku**: Kamu harus tahu judul atau pengarangnya. Kalau kamu cuma ingat jalan ceritanya (misal: *"cerita detektif yang punya asisten robot tapi suasananya lucu"*), mesin pencari biasa sering tidak menemukan apa-apa.
2. **Jebakan Spoiler Besar-besaran di Internet**: Niatnya cuma mau mencari tahu gambaran umum cerita atau profil tokoh, tapi saat mencari di Google, Fandom Wiki, Reddit, atau medsos, yang langsung muncul di hasil pencarian teratas justru bocoran fatal: siapa pelaku kejahatannya, siapa karakter yang mati, atau *plot twist* akhir cerita. Akibatnya, rasa penasaran dan kenikmatan membaca langsung hancur sebelum sempat mulai.
3. **Rekomendasi di internet sering tidak cocok**: Daftar rekomendasi di website atau media sosial biasanya cuma menampilkan judul yang lagi viral (*trending*), padahal ceritanya belum tentu sesuai selera kita.
4. **Format bacaan terpisah-pisah**: Mau cari komik harus buka aplikasi A, mau cari novel harus buka website B. Tidak ada tempat satu pintu untuk mencari bacaan lintas format.
5. **Waktu terbuang sia-sia**: Niat awalnya ingin membaca 1 jam sebelum tidur, tapi 45 menitnya habis hanya untuk mencari judul.

**Tujuan Alistair sederhana**: Mengubah proses mencari bacaan yang tadinya ribet, rawan spoiler, dan bikin pusing menjadi semudah bertanya ke teman yang paham banyak cerita.

---

## 2. Tahap 1: Empathize (Memahami Keresahan Pengguna)

Untuk memahami masalah secara nyata, kami melihat kebiasaan pembaca sehari-hari:

### Contoh Skenario Pengguna Nyata:

* **Skenario A (Lupa Judul / Hanya Ingat Plot)**:
  > *"Aku pernah baca novel fantasi yang tokoh utamanya pedagang bumbu keliling, ceritanya santai tanpa perang. Aku lupa judulnya apa, pas dicari di Google malah keluar resep masakan."*
  * **Kebutuhan**: Butuh sistem yang bisa mencari berdasarkan gambaran alur cerita, bukan sekadar kata kunci judul.

* **Skenario B (Takut Kena Spoiler Fatal di Internet)**:
  > *"Aku baru mau mulai baca satu seri dan cuma pengen tahu premis ceritanya bagus atau nggak. Tapi pas googling nama karakternya, saran pencarian Google malah otomatis nampilin 'kematian karakter X'. Mood bacaku langsung hilang seketika."*
  * **Kebutuhan**: Butuh sarana penjelajahan yang aman dan bebas spoiler (*anti-spoiler*), yang fokus menceritakan tema, nuansa, dan premis awal tanpa membocorkan rahasia penting cerita.

* **Skenario C (Mencari Berdasarkan Mood / Suasana Hati)**:
  > *"Hari ini kerjaan lagi bikin stres banget. Aku mau baca manhwa atau webtoon yang ceritanya ringan, banyak komedinya, dan bikin ketawa tanpa drama berat."*
  * **Kebutuhan**: Butuh rekomendasi yang mengerti suasana hati dan nuansa cerita, bukan cuma filter kategori kaku.

* **Skenario D (Kena 'Zonk' Rekomendasi Viral)**:
  > *"Sering banget nyobain bacaan yang lagi rame di TikTok, tapi pas dibaca ternyata ceritanya nggak nyambung sama seleraku."*
  * **Kebutuhan**: Butuh rekomendasi yang objektif dan ada penjelasan singkat kenapa cerita itu direkomendasikan.

---

## 3. Tahap 2: Define (Rumusan Masalah yang Diselesaikan)

Dari hasil pengamatan di atas, masalah intinya dirumuskan secara jelas:

> **"Orang kesulitan menemukan bacaan yang cocok karena sistem pencarian yang ada saat ini terlalu kaku (hanya berbasis judul), berisiko tinggi terkena spoiler fatal di internet, rekomendasi yang ada terlalu memaksakan hal yang viral, dan pembaca tidak punya tempat bertanya dengan bahasa percakapan santai."**

### Hal-hal yang Wajib Diselesaikan Aplikasi:
1. Pengguna bisa bertanya menggunakan **bahasa bebas sehari-hari** tanpa harus menghafal judul atau istilah khusus.
2. Menyajikan gambaran cerita yang menarik dan relevan **tanpa membocorkan jalan cerita utama atau plot twist (Aman dari Spoiler)**.
3. Hasil rekomendasi harus **relevan dengan jalan cerita atau suasana** yang diminta pengguna.
4. Aplikasi harus **membedakan jenis bacaan secara tepat** (kapan harus menyebut manga, manhwa, webtoon, atau novel).
5. Menyediakan etalase katalog yang mudah disaring bagi pengguna yang ingin melihat-lihat sendiri.
6. Membantu pengguna menyimpan bacaan favoritnya dengan rapi agar tidak lupa saat ingin membacanya nanti.

---

## 4. Tahap 3: Ideate (Solusi yang Disediakan Alistair)

Untuk menjawab masalah di atas, Alistair menyediakan fitur-fitur praktis yang langsung mengatasi kebutuhan pembaca:

| Masalah Pengguna | Solusi Praktis di Alistair | Manfaat Langsung |
| :--- | :--- | :--- |
| Takut kena spoiler besar-besaran saat browsing internet | **Rekomendasi Aman Bebas Spoiler (Anti-Spoiler)**: Alistair menyajikan premis awal, suasana, dan daya tarik karya tanpa membocorkan akhir cerita atau *twist*. | Pengguna bisa mencari info bacaan dengan aman dan tenang tanpa takut keseruan ceritanya rusak. |
| Bingung mau baca apa / lupa judul persis | **Fitur Chat Cerdas (Alistair AI)**: Cukup ceritakan jalan cerita, karakter, atau mood yang diinginkan dengan bahasa santai. | Menemukan judul yang dicari dalam hitungan detik tanpa pusing mengingat judul. |
| Rekomendasi tidak transparan (asal kasih judul) | **Penjelasan Alasan Rekomendasi**: Alistair memberi tahu ringkasan cerita dan *alasan kenapa cerita tersebut cocok* dengan yang diminta. | Pengguna tahu persis apa yang akan dibaca sebelum memutuskan, menghindari salah pilih. |
| Istilah bacaan sering tertukar | **Paham Konteks Jenis Bacaan**: Jika membahas komik Jepang disebut *manga*, komik Korea disebut *manhwa/webtoon*, dan buku bacaan disebut *novel*. | Komunikasi terasa lebih alami dan tidak membingungkan. |
| Ingin cari bacaan sendiri secara visual | **Halaman Explore dengan 100.000+ Data**: Dilengkapi filter cepat untuk 28+ genre populer dan tipe bacaan. | Pembaca punya kendali penuh untuk menelusuri katalog besar dengan filter yang rapi. |
| Lupa bacaan apa yang sudah disimpan | **Bookmark & Pengelolaan Sesi Chat**: Satu klik untuk simpan buku, dan sesi obrolan bisa diganti namanya sesuai topik (misal: "Rekomendasi Novel Horor"). | Daftar bacaan tersimpan aman dan riwayat pencarian tetap rapi. |

---

## 5. Tahap 4: Prototype (Alur Penggunaan yang Sederhana)

Alistair dirancang dengan alur yang tidak berbelit-belit agar pengguna langsung mendapatkan manfaatnya sejak menit pertama:

```
[1. Buka Aplikasi] 
       │
       ▼
[2. Ceritakan Kebutuhan di Chat]
    Contoh: "Cariin manga komedi sekolahan yang karakternya absurd tapi seru"
       │
       ▼
[3. Terima Rekomendasi Aman Bebas Spoiler]
    Alistair menampilkan 2-3 pilihan terbaik lengkap dengan ulasan daya tarik cerita
       │
       ▼
[4. Simpan ke Bookmark]
    Tinggal klik simpan jika ingin dibaca nanti, atau lanjut mengobrol untuk opsi lain
```

### Prinsip Tampilan Antarmuka:
* **Bersih dan Fokus**: Tidak dipenuhi banner iklan yang mengganggu atau pop-up membingungkan.
* **Cepat Diakses**: Dari halaman utama, pengguna bisa langsung mengetik pertanyaan atau beralih ke halaman Explore dalam satu klik.
* **Menu yang Jelas**: Riwayat obrolan tersusun rapi di samping (sidebar), lengkap dengan tombol edit nama dan hapus yang mudah ditemukan.

---

## 6. Tahap 5: Test & Iterasi (Perbaikan Nyata Berdasarkan Penggunaan)

Setelah diuji dalam penggunaan sehari-hari, beberapa hal penting disesuaikan agar aplikasi semakin nyaman digunakan:

1. **Penyajian Ringkasan Aman Tanpa Bocoran**:
   * Menjaga respons Alistair agar membedah premis pembuka, daya tarik karakter, dan atmosfer dunia cerita tanpa menyentuh *climax* atau nasib akhir tokoh.
2. **Memperbaiki Gaya Bahasa Jawaban**:
   * Aplikasi disesuaikan agar menyebut jenis karya secara tepat (manga, manhwa, webtoon, novel) sesuai topik obrolan, tidak kaku memanggil semuanya sebagai "buku".
3. **Melengkapi Filter Genre Novel**:
   * Menambahkan genre-genre penting untuk novel seperti *Fiction, Thriller, Historical, Young Adult, Classics, Horror, dan Nonfiction*.
4. **Penyempurnaan Navigasi Riwayat**:
   * Tombol tindakan di riwayat obrolan dibuat selalu terlihat dan ditambahkan opsi ubah nama sesi (*rename chat*) agar pengguna mudah menandai topik obrolan mereka.

---

## 7. Ringkasan Manfaat: Apa Nilai Utama Alistair?

Secara sederhana, Alistair hadir untuk memberikan 4 manfaat utama bagi pembaca:

1. **Hemat Waktu**: Dari yang biasanya menghabiskan waktu puluhan menit mencari judul tanpa hasil, kini cukup mengobrol 1-2 menit untuk mendapatkan pilihan bacaan yang tepat.
2. **Aman dari Spoiler Besar-besaran**: Tidak ada lagi risiko terkena bocoran akhir cerita atau kematian karakter saat sekadar ingin mencari tahu premis suatu karya.
3. **Pencarian Lebih Manusiawi**: Pembaca tidak perlu pintar mengetik kata kunci teknis. Cukup ceritakan apa yang dirasakan atau apa yang diingat, Alistair yang akan mencarikan.
4. **Katalog Lengkap Satu Pintu**: Menggabungkan ribuan komik dan puluhan ribu novel dalam satu tempat yang rapi dan mudah diakses.
