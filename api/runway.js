// Impor fetch jika menggunakan versi Node.js yang lebih lama
// const fetch = require('node-fetch');

export default async function handler(req, res) {
    // Atur header CORS untuk semua respons
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Izinkan semua domain
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Tangani permintaan preflight OPTIONS dari browser
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Pastikan hanya metode POST yang diproses
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const runwayApiKey = process.env.RUNWAY_API_KEY;
    if (!runwayApiKey) {
        return res.status(500).json({ error: 'RUNWAY_API_KEY tidak diatur di Vercel.' });
    }

    try {
        const { type, taskId, payload } = req.body;
        let runwayResponse;
        let url;

        if (type === 'query') {
            // Memeriksa status tugas yang sudah ada
            url = `https://api.runwayml.com/v1/tasks/${taskId}`;
            runwayResponse = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${runwayApiKey}` },
            });
        } else {
            // Memulai tugas generasi baru
            url = 'https://api.runwayml.com/v1/inference';
            runwayResponse = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${runwayApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
        }

        if (!runwayResponse.ok) {
            const errorBody = await runwayResponse.text();
            console.error('Runway API Error:', errorBody);
            return res.status(runwayResponse.status).json({
                error: 'Runway API Error',
                details: errorBody,
            });
        }

        const data = await runwayResponse.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('Proxy Error:', error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}

