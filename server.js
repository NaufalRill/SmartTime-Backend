const express = require('express');
const cors = require('cors');
const db = require('./db');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


// Route GET (Cek User yang terdaftar)
app.get('/api/users', (req, res) => {
    const sql = "SELECT * FROM users";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ status: 'success', data: result });
    });
});

// Route REGISTER (TAMBAHAN BARU)
app.post('/api/register', (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ success: false, message: "Data tidak lengkap" });
    }

    // 1. Cek apakah username sudah ada di DB
    const checkSql = "SELECT * FROM users WHERE username = ?";
    db.query(checkSql, [username], (err, result) => {
        if (err) return res.status(500).json(err);
        
        if (result.length > 0) {
            return res.status(400).json({ success: false, message: "Username sudah dipakai!" });
        }

        // 2. Jika aman, Masukkan data baru (INSERT)
        const insertSql = "INSERT INTO users (email, username, password) VALUES (?, ?, ?)";
        db.query(insertSql, [email, username, password], (err, result) => {
            if (err) return res.status(500).json(err);
            
            console.log("User baru terdaftar di DB!");
            res.json({ success: true, message: "Registrasi Berhasil!" });
        });
    });
});

// Route LOGIN (UPDATE: Cek ke array users, bukan hardcode lagi)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const sql = "SELECT id, username FROM users WHERE username = ? AND password = ?";
    
    db.query(sql, [username, password], (err, result) => {
        if (err) return res.status(500).json(err);

        // Jika array result ada isinya, berarti ketemu
        if (result.length > 0) {
            res.json({ 
                success: true, 
                message: "Login Berhasil!", 
                user: result[0] // Ambil data user pertama
            });
        } else {
            res.status(401).json({ success: false, message: "Username atau Password salah!" });
        }
    });
});

app.post('/api/tambahkegiatan', (req, res) => {
    const { 
        nama_kegiatan, 
        kategori, 
        tanggal, 
        waktu_mulai, 
        waktu_selesai, 
        catatan 
    } = req.body;

    // Validasi (catatan boleh kosong)
    if (!nama_kegiatan || !kategori || !tanggal || !waktu_mulai || !waktu_selesai) {
    return res.status(400).json({
        success: false,
        message: "Semua field kecuali catatan wajib diisi!"
    });
}


    const insertSql = `
    INSERT INTO tambahkegiatan 
    (nama_kegiatan, kategori, tanggal, waktu_mulai, waktu_selesai, catatan)
    VALUES (?, ?, ?, ?, ?, ?)
`;

db.query(
    insertSql,
    [nama_kegiatan, kategori, tanggal, waktu_mulai, waktu_selesai, catatan || null],
    (err, result) => {
        if (err) return res.status(500).json(err);

        console.log("Kegiatan baru masuk DB!");
        res.json({ success: true, message: "Kegiatan berhasil ditambahkan!" });
    }
);
});

// Route CREATE TUGAS
app.post('/api/tambahtugas', (req, res) => {
    const { 
        id_user,
        filter = null, 
        judul, 
        deskripsi = null, 
        deadline = null, 
        kesulitan = null, 
        prioritas = null, 
        progress = 0 
    } = req.body;

    // Validasi wajib
    if (!id_user) {
        return res.status(400).json({
            success: false,
            message: "ID User tidak ditemukan. Pastikan Anda sudah login"
        });
    }
    if (!judul || judul.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Judul tugas wajib diisi."
        });
    }

    // Query Insert
    const sql = `
        INSERT INTO tambahtugas 
        (id_user, filter, judul, deskripsi, deadline, kesulitan, prioritas, progress)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [id_user, filter, judul, deskripsi, deadline, kesulitan, prioritas, progress],
        (err, result) => {
            if (err) {
                console.error("Error INSERT tugas:", err);
                return res.status(500).json({
                    success: false,
                    message: "Gagal menyimpan tugas ke database."
                });
            }

            res.json({
                success: true,
                message: "Tugas berhasil ditambahkan!",
                insertedId: result.insertId
            });
        }
    );
});
// Route CREATE PENGINGAT (dengan id_user)
app.post('/api/tambahpengingat', (req, res) => {
    const { 
        id_user,
        nama_tugas, 
        jam, 
        menit, 
        tanggal, 
        frekuensi, 
        jenis_pengingat 
    } = req.body;

    // Validasi wajib
    if (!id_user) {
        return res.status(400).json({
            success: false,
            message: "ID User tidak ditemukan. Pastikan Anda sudah login"
        });
    }

    if (
        !nama_tugas || 
        jam === undefined || 
        menit === undefined || 
        !tanggal || 
        !frekuensi || 
        !jenis_pengingat
    ) {
        return res.status(400).json({
            success: false,
            message: "Semua field wajib diisi!"
        });
    }

    // Normalisasi tanggal (DD/MM/YYYY → YYYY-MM-DD)
    let formatTanggal = tanggal;
    if (tanggal.includes("/")) {
        const [dd, mm, yyyy] = tanggal.split("/");
        formatTanggal = `${yyyy}-${mm}-${dd}`;
    }

    const sql = `
        INSERT INTO tambahpengingat 
        (id_user, nama_tugas, jam, menit, tanggal, frekuensi, jenis_pengingat)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [id_user, nama_tugas, jam, menit, formatTanggal, frekuensi, jenis_pengingat],
        (err, result) => {
            if (err) {
                console.error("Error INSERT pengingat:", err);
                return res.status(500).json({
                    success: false,
                    message: "Gagal menyimpan pengingat ke database."
                });
            }

            res.json({
                success: true,
                message: "Pengingat berhasil ditambahkan!",
                insertedId: result.insertId
            });
        }
    );
});


// GET Tugas dengan Filter (Query Parameter)
app.get('/api/tugas', (req, res) => {
    // 1. Tangkap parameter 'kategori' dari URL (misal: ?kategori=Kuliah)
    const { id_user, kategori } = req.query; 

    console.log("--> Request Filter masuk untuk User ID:", id_user, "Kategori:", kategori);

    if (!id_user) {
        return res.status(400).json({ success: false, message: "ID User wajib disertakan!" });
    }

    let sql = "SELECT * FROM tambahtugas where id_user = ?"; 
    let params = [id_user];

    // 2. Jika ada kategori dan bukan 'Semua', tambahkan WHERE
    if (kategori && kategori !== 'Semua' && kategori !== '') {
        // Pastikan nama kolom di database adalah 'filter' (sesuai gambar Anda)
        sql += " AND filter = ?"; 
        params.push(kategori);
    }

    // 3. Urutkan berdasarkan deadline
    sql += " ORDER BY deadline ASC";

    console.log("--> Menjalankan SQL:", sql);
    console.log("--> Parameter:", params);

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("Error SELECT tugas:", err);
            return res.status(500).json({ success: false, message: "Error DB" });
        }
        res.json({ success: true, data: result });
    });
});



// ✅ ROUTE DELETE TUGAS
app.delete('/api/tugas/:id', (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM tambahtugas WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error DELETE tugas:", err);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus tugas"
            });
        }

        // Jika tidak ada baris yang terhapus
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Tugas tidak ditemukan"
            });
        }

        res.json({
            success: true,
            message: "Tugas berhasil dihapus"
        });
    });
});


// ✅ ROUTE DELETE TUGAS
app.delete('/api/tugas/:id', (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM tambahtugas WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error DELETE tugas:", err);
            return res.status(500).json({
                success: false,
                message: "Gagal menghapus tugas"
            });
        }

        // Jika tidak ada baris yang terhapus
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Tugas tidak ditemukan"
            });
        }

        res.json({
            success: true,
            message: "Tugas berhasil dihapus"
        });
    });
});


// Contoh Backend (Express.js)
app.get('/api/tugas/:id', (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM tambahtugas WHERE id = ?";
    
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        
        // Cek apakah data ditemukan
        if (result.length > 0) {
            res.json({ success: true, data: result[0] }); // Kirim object pertama saja
        } else {
            res.json({ success: false, message: "Tugas tidak ditemukan" });
        }
    });
});

// Route Update Tugas (PATCH)
app.patch('/api/tugas/:id', (req, res) => {
    const id = req.params.id;
    const { filter, judul, deskripsi, deadline, kesulitan, prioritas, progress } = req.body;

    const sql = `
        UPDATE tambahtugas 
        SET filter = ?, judul = ?, deskripsi = ?, deadline = ?, kesulitan = ?, prioritas = ?, progress = ?
        WHERE id = ?`;

    db.query(
        sql,
        [filter, judul, deskripsi, deadline, kesulitan, prioritas, progress, id],
        (err, result) => {
            if (err) {
                console.error("Error UPDATE tugas:", err);
                return res.status(500).json({
                    success: false,
                    message: "Gagal mengupdate tugas."
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Tugas tidak ditemukan."
                });
            }

            res.json({
                success: true,
                message: "Tugas berhasil diperbarui!",
            });
        }
    );
});


/* ======================================================
   PENGINGAT (SUDAH SIAP DATE & TIME PICKER)
====================================================== */


// =======================
// GET SEMUA PENGINGAT (UNTUK NOTIFIKASI)
// =======================
app.get('/api/pengingat', (req, res) => {
    const sql = `
        SELECT id, nama_tugas, tanggal, jam, menit, frekuensi, jenis_pengingat
        FROM tambahpengingat
        ORDER BY tanggal ASC, jam ASC, menit ASC
    `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Error GET pengingat:", err);
            return res.status(500).json({
                success: false,
                message: "Gagal mengambil data pengingat"
            });
        }

        res.json(result); // ⬅️ langsung array, cocok untuk React Native
    });
});




app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});