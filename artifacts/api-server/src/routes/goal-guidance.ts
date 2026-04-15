import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

router.post("/goal-guidance", async (req, res) => {
  const {
    title,
    area,
    subarea,
    franjaEtaria,
    definicionOperativa,
  } = req.body as {
    title?: string;
    area?: string;
    subarea?: string;
    franjaEtaria?: string;
    definicionOperativa?: string;
  };

  if (!title) return res.status(400).json({ error: "title is required" });

  const contexto = [
    title,
    area ? `Área: ${area}` : null,
    subarea ? `Subárea: ${subarea}` : null,
    franjaEtaria ? `Franja etaria: ${franjaEtaria} años` : null,
    definicionOperativa ? `Definición: ${definicionOperativa}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `Eres un fonoaudiólogo clínico experto en terapia del lenguaje y cognición infantil. 
Respondes SIEMPRE en JSON válido con exactamente dos campos: "marcoConceptual" y "sugerenciaFamilia".
No incluyas texto fuera del JSON. No uses markdown.`;

  const userPrompt = `Dado el siguiente objetivo terapéutico, genera:

1. "marcoConceptual": 1-2 oraciones explicando POR QUÉ este objetivo importa para el desarrollo del niño. Lenguaje clínico pero accesible.

2. "sugerenciaFamilia": 1-2 actividades simples que los cuidadores pueden hacer en casa. Sin tecnicismos. Usa verbos de acción (nombrar, señalar, jugar, leer, contar, imitar).

Objetivo:
${contexto}

Responde con este JSON exacto (sin código markdown):
{"marcoConceptual": "...", "sugerenciaFamilia": "• Actividad 1.\n• Actividad 2."}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const choice = completion.choices[0];
    const raw = (choice?.message?.content ?? "").trim();

    // Try direct parse first, then extract JSON block
    let parsed: { marcoConceptual: string; sugerenciaFamilia: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Strip markdown code fences if present
      const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const jsonMatch = stripped.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid JSON response from AI");
      parsed = JSON.parse(jsonMatch[0]);
    }

    return res.json({
      marcoConceptual: parsed.marcoConceptual?.trim() ?? "",
      sugerenciaFamilia: parsed.sugerenciaFamilia?.trim() ?? "",
    });
  } catch (err: any) {
    console.error("goal-guidance error:", err?.message ?? err);
    return res.status(500).json({ error: "Error generating guidance" });
  }
});

export default router;
