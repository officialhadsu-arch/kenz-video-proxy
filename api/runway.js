// Mengizinkan Vercel untuk mengetahui tipe fungsi ini
export const config = {
  runtime: 'edge',
};

// Fungsi utama yang akan menangani permintaan API
export default async function handler(request) {
  // Hanya izinkan metode POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    // 1. Ambil data (seperti prompt & durasi) yang dikirim dari Kenz Video Generator
    const body = await request.json();
    
    // 2. Ambil API Key RunwayML yang kita simpan dengan aman di Vercel
    const runwayApiKey = process.env.RUNWAY_API_KEY;

    if (!runwayApiKey) {
      return new Response(JSON.stringify({ error: 'RUNWAY_API_KEY is not configured on the server.' }), { status: 500 });
    }

    // 3. Tentukan URL tujuan di RunwayML berdasarkan tipe permintaan
    let runwayUrl = 'https://api.runwayml.com/v1/inference'; // Default untuk memulai generasi
    if (body.type === 'query') {
      runwayUrl = `https://api.runwayml.com/v1/tasks/${body.taskId}`;
    }

    // 4. Buat permintaan ke RunwayML menggunakan API Key rahasia
    const response = await fetch(runwayUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${runwayApiKey}`,
        'Content-Type': 'application/json',
      },
      // Kirim data asli jika ini permintaan untuk memulai, atau kosongkan jika hanya query status
      body: body.type === 'query' ? null : JSON.stringify(body.payload),
    });

    // 5. Tangani jika RunwayML memberikan error
    if (!response.ok) {
        const errorData = await response.json();
        return new Response(JSON.stringify(errorData), { status: response.status });
    }

    // 6. Ambil hasil dari RunwayML dan kirimkan kembali ke Kenz Video Generator
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Header penting untuk mengizinkan Canvas berkomunikasi dengan Vercel
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
