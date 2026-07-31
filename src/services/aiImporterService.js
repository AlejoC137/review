/**
 * AI Importer Service
 * Uses Google Gemini API to parse free-text descriptions into structured level data.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `Eres un asistente BIM/arquitectura experto. Tu tarea es extraer información de niveles/pisos de un edificio a partir de texto libre en español.

Dado un texto que describe pisos o niveles de un edificio, devuelve ÚNICAMENTE un JSON válido con un array de objetos con esta estructura exacta:
[
  {
    "nombre": "string (nombre del nivel, ej: Planta Baja, Piso 1, Sótano 1)",
    "elevacion": "string (elevación/cota con unidades, ej: +0.00m, -3.50m, +3.50m)",
    "indice": number (número entero de orden del nivel, empezando desde 0 para el más bajo),
    "descripcion": "string (descripción opcional, puede estar vacía)"
  }
]

Reglas importantes:
- Si no se menciona elevación, infiere una razonable (ej: 3m entre pisos estándar).
- Si no se menciona índice/orden, asígnalos de menor a mayor elevación.
- El "nombre" debe ser claro y en español (ej: "Sótano", "Planta Baja", "Piso 1", "Azotea").
- NO incluyas texto adicional, SOLO el JSON válido.
- Si el texto no describe niveles de edificio, devuelve un array vacío [].`;

/**
 * Parsea una descripción libre de niveles usando Google Gemini.
 * @param {string} userText - Texto libre describiendo los niveles
 * @param {string} apiKey - Google Gemini API key
 * @returns {Promise<Array>} - Array de objetos { nombre, elevacion, indice, descripcion }
 */
export async function parseLevelsWithAI(userText, apiKey) {
    if (!userText?.trim()) throw new Error('El texto de descripción está vacío.');
    if (!apiKey?.trim()) throw new Error('La API key de Gemini es requerida.');

    const requestBody = {
        contents: [
            {
                role: 'user',
                parts: [
                    {
                        text: `${SYSTEM_PROMPT}\n\nTexto a procesar:\n"${userText.trim()}"`
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json'
        }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const message = errData?.error?.message || `Error HTTP ${response.status}`;
        throw new Error(`Error de Gemini API: ${message}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    try {
        // Limpia posibles bloques markdown ```json ... ```
        const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(cleaned);

        if (!Array.isArray(parsed)) throw new Error('La respuesta no es un array.');

        // Valida y normaliza cada nivel
        return parsed.map((level, idx) => ({
            nombre: String(level.nombre || `Nivel ${idx + 1}`).trim(),
            elevacion: String(level.elevacion || '').trim(),
            indice: typeof level.indice === 'number' ? level.indice : idx,
            descripcion: String(level.descripcion || '').trim()
        }));
    } catch (e) {
        console.error('Error parseando respuesta de Gemini:', rawText, e);
        throw new Error('No se pudo interpretar la respuesta de la IA. Intenta con una descripción más clara.');
    }
}
