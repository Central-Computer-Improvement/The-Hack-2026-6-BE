const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const pool = require("../config/db");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
    try {
        const { id_token } = req.body; // token ini dikirim dari frontend/app

        // Verifikasi ke server Google, sekaligus ambil data profilnya
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        // Cek apakah google_id ini sudah pernah daftar
        const [existing] = await pool.query(
            `SELECT * FROM users WHERE google_id = ?`,
            [googleId]
        );

        let user;
        if (existing.length > 0) {
            user = existing[0]; // sudah ada -> login
        } else {
            // belum ada -> daftar otomatis
            const id = crypto.randomUUID();
            await pool.query(
                `INSERT INTO users (id, name, email, password, photo_url, google_id, auth_provider, role)
         VALUES (?, ?, ?, NULL, ?, ?, 'google', 'student')`,
                [id, name, email, picture, googleId]
            );
            const [rows] = await pool.query(`SELECT * FROM users WHERE id = ?`, [id]);
            user = rows[0];
        }

        return res.json({ success: true, data: user });
    } catch (err) {
        console.error(err);
        return res.status(401).json({ success: false, message: "Token Google tidak valid" });
    }
};