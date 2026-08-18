const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../config/db");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const SAFE_COLUMNS =
    "id, name, email, photo_url, role, coins, streak_count, auth_provider, created_at, updated_at";

// Sekarang generateToken WAJIB dikasih sessionId, biar tersisip sebagai "sid"
// di dalam token -> ini yang dipakai authMiddleware buat ngecek token masih
// sesi aktif atau sudah "ketiban" login baru dari tempat lain.
function generateToken(user, sessionId) {
    return jwt.sign(
        { id: user.id, role: user.role, sid: sessionId },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

// ============================================================
// LOGIN MANUAL - POST /api/auth/login
// ============================================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "email dan password wajib diisi",
            });
        }

        const [rows] = await pool.query(`SELECT * FROM users WHERE email = ?`, [
            email,
        ]);

        if (rows.length === 0) {
            return res
                .status(401)
                .json({ success: false, message: "Email atau password salah" });
        }

        const user = rows[0];

        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: "Akun ini terdaftar lewat Google. Silakan login pakai Google.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res
                .status(401)
                .json({ success: false, message: "Email atau password salah" });
        }

        // Bikin session baru & simpan ke DB -> otomatis "mematikan" sesi lama
        const sessionId = crypto.randomUUID();
        await pool.query(`UPDATE users SET active_session_id = ? WHERE id = ?`, [
            sessionId,
            user.id,
        ]);

        const token = generateToken(user, sessionId);
        delete user.password;

        return res.json({ success: true, data: { user, token } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// ============================================================
// LOGIN / REGISTER PAKAI GOOGLE - POST /api/auth/google
// ============================================================
exports.googleLogin = async (req, res) => {
    try {
        const { id_token } = req.body;

        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        const [existing] = await pool.query(
            `SELECT ${SAFE_COLUMNS} FROM users WHERE google_id = ?`,
            [googleId]
        );

        let user;
        if (existing.length > 0) {
            user = existing[0];
        } else {
            const id = crypto.randomUUID();
            await pool.query(
                `INSERT INTO users (id, name, email, password, photo_url, google_id, auth_provider, role)
         VALUES (?, ?, ?, NULL, ?, ?, 'google', 'student')`,
                [id, name, email, picture, googleId]
            );
            const [rows] = await pool.query(
                `SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`,
                [id]
            );
            user = rows[0];
        }

        // Sama kayak login manual: session baru tiap kali login Google
        const sessionId = crypto.randomUUID();
        await pool.query(`UPDATE users SET active_session_id = ? WHERE id = ?`, [
            sessionId,
            user.id,
        ]);

        const token = generateToken(user, sessionId);

        return res.json({ success: true, data: { user, token } });
    } catch (err) {
        console.error(err);
        return res.status(401).json({ success: false, message: "Token Google tidak valid" });
    }
};

// ============================================================
// LOGOUT - POST /api/auth/logout (wajib requireAuth di route-nya)
// ============================================================
exports.logout = async (req, res) => {
    try {
        await pool.query(
            `UPDATE users SET active_session_id = NULL WHERE id = ?`,
            [req.user.id]
        );
        return res.json({ success: true, message: "Berhasil logout" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};