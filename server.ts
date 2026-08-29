import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── POST /api/auth/login ──────────────────────────────────────────────────
// Lightweight workshop gate — not a real auth system. Credentials live only
// on the server so they aren't shipped in the client bundle.
// ──────────────────────────────────────────────────────────────────────────
const WORKSHOP_USERNAME = 'masterclass';
const WORKSHOP_PASSWORD = 'agentic26';

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === WORKSHOP_USERNAME && password === WORKSHOP_PASSWORD) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: 'Invalid username or password' });
});

// In-Memory Database for ITDO Workflow State
let ALERTS_STORE: any[] = [
  {
    id: 'ALT-1001',
    prediction_id: 'PRED-8842',
    patient_ref: 'PT-8842',
    patient_name: 'Eleanor Vance',
    disease_type: 'diabetes',
    probability: 0.8640,
    risk_level: 'high',
    threshold: 0.70,
    flags: [
      'Elevated Fasting Glucose (148.0 mg/dL, normal: 70-99)',
      'Obese Range BMI (33.6 kg/m², normal: 18.5-24.9)',
      'Advanced Age Risk Factor (50 yrs)'
    ],
    status: 'OPEN',
    severity: 'HIGH',
    assigned_to: 'Dr. Sarah Jenkins, MD',
    notes: 'Triggered automatically via ITDO threshold engine (>0.70). Immediate HbA1c required.',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'ALT-1002',
    prediction_id: 'PRED-9421',
    patient_ref: 'PT-9421',
    patient_name: 'Gloria Ramirez',
    disease_type: 'diabetes',
    probability: 0.9410,
    risk_level: 'high',
    threshold: 0.70,
    flags: [
      'Elevated Fasting Glucose (197.0 mg/dL, normal: 70-99)',
      'Hyperinsulinemia Indicator (543 µIU/mL)',
      'Obese Range BMI (30.5 kg/m², normal: 18.5-24.9)',
      'Advanced Age Risk Factor (54 yrs)'
    ],
    status: 'ACKNOWLEDGED',
    severity: 'CRITICAL',
    assigned_to: 'Endocrinology Triage Unit',
    notes: 'Patient contacted. Clinic appointment scheduled for tomorrow morning.',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 10).toISOString()
  },
  {
    id: 'ALT-1003',
    prediction_id: 'PRED-7714',
    patient_ref: 'PT-7714',
    patient_name: 'David Miller',
    disease_type: 'diabetes',
    probability: 0.9120,
    risk_level: 'high',
    threshold: 0.70,
    flags: [
      'Elevated Fasting Glucose (189.0 mg/dL, normal: 70-99)',
      'Hyperinsulinemia Indicator (846 µIU/mL)',
      'Obese Range BMI (30.1 kg/m², normal: 18.5-24.9)'
    ],
    status: 'OPEN',
    severity: 'HIGH',
    assigned_to: 'Nurse Practitioner Robert Lee',
    notes: 'Lab order generated. Fasting blood draw pending.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

let TASKS_STORE: any[] = [
  {
    id: 'TSK-2001',
    alert_id: 'ALT-1001',
    patient_ref: 'PT-8842',
    patient_name: 'Eleanor Vance',
    disease_type: 'diabetes',
    title: 'Order Confirmatory Glycated Hemoglobin (HbA1c) & Fasting Lipid Panel',
    description: 'Patient flagged with 86.4% diabetes probability and glucose 148 mg/dL. Requisition sent to Quest Diagnostics.',
    intervention: 'Laboratory Diagnostic Requisition',
    status: 'TODO',
    priority: 'URGENT',
    due_date: '2026-09-01',
    assigned_to: 'Clinical Triage Coordinator',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'TSK-2002',
    alert_id: 'ALT-1002',
    patient_ref: 'PT-9421',
    patient_name: 'Gloria Ramirez',
    disease_type: 'diabetes',
    title: 'Urgent Referral to Endocrinology & Diabetes Educator (DSMES)',
    description: 'Severe fasting hyperglycemia (197 mg/dL) and insulin resistance. Conduct comprehensive metabolic assessment.',
    intervention: 'Specialist Referral & Patient Education',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    due_date: '2026-08-30',
    assigned_to: 'Endocrinology Care Team',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'TSK-2003',
    alert_id: 'ALT-1003',
    patient_ref: 'PT-7714',
    patient_name: 'David Miller',
    disease_type: 'diabetes',
    title: 'Initiate Medical Nutrition Therapy (MNT) & Continuous Glucose Monitoring Setup',
    description: 'Target dietary carbohydrate reduction (<45g/meal) and evaluate for 14-day CGM sensor placement.',
    intervention: 'Medical Nutrition Therapy & Device Enrollment',
    status: 'TODO',
    priority: 'HIGH',
    due_date: '2026-09-04',
    assigned_to: 'Registered Dietitian (RD)',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'TSK-2004',
    patient_ref: 'PT-6023',
    patient_name: 'Sophia Patel',
    disease_type: 'diabetes',
    title: 'Schedule 3-Month Pre-Diabetes Glycemic Screening Follow-up',
    description: 'Moderate risk patient (glucose 116 mg/dL). Enroll in community lifestyle coaching program.',
    intervention: 'Preventative Care Tracking',
    status: 'DONE',
    priority: 'MEDIUM',
    due_date: '2026-08-25',
    assigned_to: 'Care Navigator',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 30).toISOString()
  }
];

let PREDICTIONS_STORE: any[] = [];

// Gemini Client Lazy Initialization
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
  }
  return geminiClient;
}

// ──────────────────────────────────────────────────────────────────────────────
// OpenAI Client — the copilot chat's reasoning + augmentation engine.
// API key can come from either source, checked in this order:
//   1. Runtime override — pasted into the in-app Settings panel while the
//      server is running (POST /api/settings/openai-key). Kept in memory only.
//   2. .env — OPENAI_API_KEY, loaded once at process start via dotenv/config.
// A fresh client is constructed per call (cheap) so a runtime key change
// takes effect on the very next chat message, with no restart needed.
// ──────────────────────────────────────────────────────────────────────────────
let runtimeOpenAIKey: string | null = null;

function getOpenAIKey(): { key: string | null; source: 'runtime' | 'env' | null } {
  if (runtimeOpenAIKey) return { key: runtimeOpenAIKey, source: 'runtime' };
  if (process.env.OPENAI_API_KEY) return { key: process.env.OPENAI_API_KEY, source: 'env' };
  return { key: null, source: null };
}

function getOpenAI(): OpenAI | null {
  const { key } = getOpenAIKey();
  return key ? new OpenAI({ apiKey: key }) : null;
}

function maskKey(key: string): string {
  if (key.length <= 8) return '••••';
  return `${key.slice(0, 3)}…${key.slice(-4)}`;
}

app.get('/api/settings/openai-key', (req, res) => {
  const { key, source } = getOpenAIKey();
  res.json({ configured: !!key, source, masked: key ? maskKey(key) : null });
});

app.post('/api/settings/openai-key', (req, res) => {
  const { apiKey } = req.body || {};
  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    return res.status(400).json({ error: 'apiKey is required' });
  }
  runtimeOpenAIKey = apiKey.trim();
  res.json({ ok: true, masked: maskKey(runtimeOpenAIKey) });
});

app.delete('/api/settings/openai-key', (req, res) => {
  runtimeOpenAIKey = null;
  const { key, source } = getOpenAIKey();
  res.json({ ok: true, configured: !!key, source });
});

// ──────────────────────────────────────────────────────────────────────────────
// Python .sav Model Inference Helper
// Spawns backend/predict_sav.py, sends JSON payload via stdin,
// parses JSON result from stdout. Falls back to null on error.
// ──────────────────────────────────────────────────────────────────────────────
const PYTHON_SCRIPT = path.join(process.cwd(), 'backend', 'predict_sav.py');

function runPythonInference(payload: object): Promise<{
  probability: number;
  prediction: number;
  model_name: string;
  disease_type: string;
} | null> {
  return new Promise((resolve) => {
    // Skip if script doesn't exist
    if (!fs.existsSync(PYTHON_SCRIPT)) {
      console.warn('[ML] predict_sav.py not found at', PYTHON_SCRIPT);
      resolve(null);
      return;
    }

    const py = spawn('python', [PYTHON_SCRIPT], { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    py.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    py.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    py.on('close', (code) => {
      if (stderr) {
        // Filter out sklearn InconsistentVersionWarning (non-fatal)
        const nonFatal = stderr.split('\n').filter(
          (l) => !l.includes('InconsistentVersionWarning') &&
                  !l.includes('warnings.warn') &&
                  !l.includes('https://scikit-learn') &&
                  l.trim().length > 0
        );
        if (nonFatal.length > 0) {
          console.error('[ML] Python stderr:', nonFatal.join('\n'));
        }
      }
      if (code !== 0 || !stdout.trim()) {
        console.error('[ML] Python inference failed, code:', code, 'stdout:', stdout);
        resolve(null);
        return;
      }
      try {
        const result = JSON.parse(stdout.trim());
        if (result.error) {
          console.error('[ML] Python inference error:', result.error);
          resolve(null);
        } else {
          resolve(result);
        }
      } catch (e) {
        console.error('[ML] Failed to parse Python output:', stdout);
        resolve(null);
      }
    });

    py.on('error', (err) => {
      console.error('[ML] Failed to spawn Python:', err.message);
      resolve(null);
    });

    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Python .sav Model Evaluation Helper (real holdout metrics)
// Spawns backend/eval_metrics.py <disease>, which reproduces the exact
// train/test split used when the .sav model was trained and reports genuine
// accuracy/AUC/etc. Cached in-memory since it retrains 5 CV folds per call.
// ──────────────────────────────────────────────────────────────────────────────
const EVAL_SCRIPT = path.join(process.cwd(), 'backend', 'eval_metrics.py');
const METRICS_CACHE = new Map<string, { data: any; ts: number }>();
const METRICS_CACHE_TTL_MS = 10 * 60 * 1000;

function runPythonEval(diseaseType: string): Promise<any | null> {
  return new Promise((resolve) => {
    if (!fs.existsSync(EVAL_SCRIPT)) {
      resolve(null);
      return;
    }

    const py = spawn('python', [EVAL_SCRIPT, diseaseType], { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    py.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    py.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    py.on('close', (code) => {
      if (code !== 0 || !stdout.trim()) {
        console.warn('[Metrics] Python eval failed for', diseaseType, stderr.slice(0, 300));
        resolve(null);
        return;
      }
      try {
        const result = JSON.parse(stdout.trim());
        if (result.error) {
          console.warn('[Metrics] Python eval error for', diseaseType, ':', result.error);
          resolve(null);
        } else {
          resolve(result);
        }
      } catch (e) {
        resolve(null);
      }
    });

    py.on('error', () => resolve(null));
  });
}


// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '3.2.0',
    framework: 'ITDO + CRISP-DM + Trained .sav ML Models',
    openai_configured: !!getOpenAIKey().key,
    python_model: fs.existsSync(PYTHON_SCRIPT),
    model_path: PYTHON_SCRIPT,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/dataset/sample', (req, res) => {
  try {
    const filePath = path.join(process.cwd(), 'dataset', 'diabetes.csv');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');
      const headers = lines[0].split(',');
      const rows = lines.slice(1, 51).map((line) => {
        const values = line.split(',');
        const rowObj: Record<string, any> = {};
        headers.forEach((h, i) => {
          rowObj[h] = isNaN(Number(values[i])) ? values[i] : Number(values[i]);
        });
        return rowObj;
      });
      return res.json({
        total_rows: lines.length - 1,
        headers,
        sample_rows: rows
      });
    }
    return res.status(404).json({ error: 'Dataset file not found' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Deterministic Feature Flagger
function getAbnormalFlags(f: any): string[] {
  const flags: string[] = [];
  if (f.glucose > 99) {
    flags.push(`Elevated Fasting Glucose (${Number(f.glucose).toFixed(1)} mg/dL, normal: 70-99)`);
  } else if (f.glucose > 0 && f.glucose < 70) {
    flags.push(`Hypoglycemic Glucose (${Number(f.glucose).toFixed(1)} mg/dL, normal: 70-99)`);
  }

  if (f.bloodPressure > 80) {
    flags.push(`Elevated Diastolic BP (${Number(f.bloodPressure).toFixed(1)} mmHg, normal: 60-80)`);
  } else if (f.bloodPressure > 0 && f.bloodPressure < 60) {
    flags.push(`Low Diastolic BP (${Number(f.bloodPressure).toFixed(1)} mmHg, normal: 60-80)`);
  }

  if (f.bmi >= 30.0) {
    flags.push(`Obese Range BMI (${Number(f.bmi).toFixed(1)} kg/m², normal: 18.5-24.9)`);
  } else if (f.bmi > 24.9) {
    flags.push(`Overweight BMI (${Number(f.bmi).toFixed(1)} kg/m², normal: 18.5-24.9)`);
  }

  if (f.diabetesPedigree > 0.65) {
    flags.push(`High Genetic Pedigree Risk Score (${Number(f.diabetesPedigree).toFixed(3)})`);
  }

  if (f.age >= 45) {
    flags.push(`Advanced Age Risk Factor (${Math.round(f.age)} yrs)`);
  }

  if (f.insulin > 166) {
    flags.push(`Hyperinsulinemia Indicator (${Number(f.insulin).toFixed(0)} µIU/mL)`);
  }

  return flags;
}

// AI Agentic Explanation Endpoint
app.post('/api/explain', async (req, res) => {
  const { probability, flags, patient_ref, disease_type = 'diabetes' } = req.body;
  const risk_level = probability >= 0.70 ? 'high' : probability >= 0.40 ? 'moderate' : 'low';

  const defaultDisclaimer =
    'AI Health Copilot Pro provides clinical decision support for screening and risk stratification only. ' +
    'It is NOT a diagnostic device. All risk estimates and recommendations must be reviewed and confirmed ' +
    'by a licensed healthcare professional alongside diagnostic lab testing (HbA1c, OGTT, lipid panel).';

  const flagsFormatted = Array.isArray(flags) && flags.length > 0
    ? flags.map((f: string) => `- ${f}`).join('\n')
    : '- All measured features within baseline normal limits';

  const ai = getGemini();

  if (ai) {
    try {
      const prompt = `
You are AI Health Copilot Pro (Version 3.1.0), an evidence-based clinical decision support assistant adhering strictly to Chapter 10 Agentic ML Integration.

PATIENT RISK STRATIFICATION DATA:
- Calibrated ML Probability: ${(probability * 100).toFixed(1)}% (${probability.toFixed(4)})
- Baseline Risk Category: ${risk_level.toUpperCase()}
- Disease Screening Type: ${disease_type}
- Deterministically Detected Abnormal Feature Flags:
${flagsFormatted}

CRITICAL CLINICAL COMMUNICATION RULES:
1. Reason ONLY from the provided abnormal flags and calculated risk probability.
2. NEVER invent unmeasured clinical factors or extrapolate symptoms not provided.
3. Categorize risk_level strictly as "${risk_level}".
4. In key_factors: return a JSON array of 2 to 4 precise clinical bullet points explaining primary physiological drivers.
5. In recommendation: provide 2 to 3 actionable, evidence-based next clinical steps (such as confirmatory lab tests e.g. HbA1c/OGTT, lifestyle/nutrition coaching, endocrinology referral, or routine follow-up).
6. In disclaimer: include the mandatory clinical decision support advisory statement.

Return ONLY a valid JSON object matching:
{
  "risk_level": "${risk_level}",
  "key_factors": ["string", "string"],
  "recommendation": "string",
  "disclaimer": "${defaultDisclaimer}"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const text = response.text ? response.text.trim() : '';
      const parsed = JSON.parse(text);
      return res.json({
        ...parsed,
        source: 'gemini-agent'
      });
    } catch (err: any) {
      console.warn('Gemini explanation error, falling back to deterministic reasoning:', err.message);
    }
  }

  // High-reliability deterministic clinical fallback
  let recommendation = '';
  if (risk_level === 'high') {
    recommendation =
      'Tier-1 Urgent Diagnostic Protocol: Order confirmatory laboratory diagnostics including Fasting Plasma Glucose (FPG) and Glycated Hemoglobin (HbA1c). Initiate urgent primary care consultation, diabetes self-management education (DSMES), and medical nutrition therapy.';
  } else if (risk_level === 'moderate') {
    recommendation =
      'Tier-2 Monitoring & Lifestyle Coaching: Schedule follow-up glycemic screening within 3-6 months. Recommend lifestyle intervention targeting 5-7% weight reduction and at least 150 minutes of moderate aerobic physical activity weekly.';
  } else {
    recommendation =
      'Tier-3 Routine Prevention: Maintain annual preventative wellness checkups and routine metabolic panel. Encourage ongoing balanced nutrition and regular physical activity.';
  }

  const key_factors = Array.isArray(flags) && flags.length > 0
    ? flags.slice(0, 4)
    : [
        'All measured metabolic features fall within standard clinical reference ranges.',
        `Calculated risk probability of ${(probability * 100).toFixed(1)}% aligns with low-risk baseline population.`
      ];

  return res.json({
    risk_level,
    key_factors,
    recommendation,
    disclaimer: defaultDisclaimer,
    source: 'deterministic-clinical-engine'
  });
});

// ─── POST /api/chat ────────────────────────────────────────────────────────
// Copilot chat: reasons over predictions and answers free-form questions,
// powered by OpenAI (key from Settings-panel override, else .env). Grounded
// in the current on-screen prediction context (if any) and an optional
// uploaded attachment (image or text). Falls back to a short deterministic
// answer only when no OpenAI key is configured at all.
// ──────────────────────────────────────────────────────────────────────────
const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';

app.post('/api/chat', async (req, res) => {
  const { message = '', history = [], context, attachment } = req.body;

  // ── Augmentation layer: ground the assistant in the exact model, the raw
  // input data that was submitted, and the resulting prediction — rather
  // than letting it reason from the bare probability alone. ─────────────────
  const contextBlock = context
    ? [
        `MODEL CARD`,
        `- Model: ${context.model_name}`,
        `- Disease screened: ${context.disease_type}`,
        ``,
        `INPUT DATA (as submitted by the user)`,
        context.raw_features && Object.keys(context.raw_features).length
          ? Object.entries(context.raw_features).map(([k, v]) => `- ${k}: ${v}`).join('\n')
          : '(not provided)',
        ``,
        `PREDICTION RESULT`,
        `- Probability: ${(context.probability * 100).toFixed(1)}%`,
        `- Risk level: ${context.risk_level}`,
        `- Deterministic abnormal flags: ${Array.isArray(context.flags) && context.flags.length ? context.flags.join('; ') : 'none'}`
      ].join('\n')
    : 'No prediction is currently on screen — the user has not run the model yet.';

  const openai = getOpenAI();

  if (openai) {
    try {
      const systemPrompt = `You are the AI Health Copilot chat assistant. Your job is to REASON over the grounding data provided in each turn (a model card, the exact input values, and the prediction result) and explain WHY the model produced its result, or answer the user's question using only that data — never invent clinical facts that aren't in it. Be short, plain, and direct (2-5 sentences, no headers, no markdown tables). Always defer to a licensed clinician for actual diagnosis.`;

      const historyMessages = Array.isArray(history)
        ? history.slice(-8).map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.text
          }))
        : [];

      const userTextParts = [`GROUNDING DATA:\n${contextBlock}`, `\nUser: ${message || '(see attachment)'}`];
      if (attachment?.text) {
        userTextParts.push(`\nAttached file "${attachment.name}":\n${attachment.text}`);
      }

      const userContent: any[] = [{ type: 'text', text: userTextParts.join('\n') }];
      if (attachment?.dataBase64 && attachment?.mimeType) {
        userContent.push({
          type: 'image_url',
          image_url: { url: `data:${attachment.mimeType};base64,${attachment.dataBase64}` }
        });
      }

      const completion = await openai.chat.completions.create({
        model: OPENAI_CHAT_MODEL,
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          ...historyMessages,
          { role: 'user', content: userContent }
        ] as any
      });

      const reply = completion.choices[0]?.message?.content?.trim() || "I couldn't generate a response.";
      return res.json({ reply, source: 'openai-agent', model: OPENAI_CHAT_MODEL });
    } catch (err: any) {
      console.warn('Chat: OpenAI error, falling back:', err.message);
    }
  }

  // ── Deterministic fallback (no OpenAI key configured) ──────────────────────
  let reply: string;
  if (!context) {
    reply = 'Add your OpenAI API key in Settings, then run a prediction so I have something to reason over.';
  } else {
    const pct = (context.probability * 100).toFixed(1);
    const flagsText = Array.isArray(context.flags) && context.flags.length
      ? context.flags.slice(0, 3).join('; ')
      : 'no abnormal flags';
    const inputSummary = context.raw_features && Object.keys(context.raw_features).length
      ? ' Submitted values — ' + Object.entries(context.raw_features).slice(0, 5).map(([k, v]) => `${k}: ${v}`).join(', ') + '.'
      : '';
    reply = `This ${context.disease_type} prediction is ${pct}% (${context.risk_level} risk), from ${context.model_name}. Main drivers: ${flagsText}.${inputSummary} Add an OpenAI API key in Settings for full reasoning and file-reading. This is screening support only — confirm with a clinician before acting on it.`;
  }
  return res.json({ reply, source: 'deterministic-fallback' });
});

// Predictions History & Creation
app.get('/api/predictions', (req, res) => {
  res.json(PREDICTIONS_STORE);
});

// ─── POST /api/predict ─────────────────────────────────────────────────────
// Primary prediction endpoint. Calls the trained .sav model via Python.
// Falls back to the logistic heuristic if Python is unavailable.
// ──────────────────────────────────────────────────────────────────────────
app.post('/api/predict', async (req, res) => {
  const { patient_ref = 'PT-DEMO', disease_type = 'diabetes', features } = req.body;
  const f = features || {};

  // Deterministic clinical flags (works for all disease types)
  const flags = getAbnormalFlags(f);

  let proba: number;
  let model_name: string;

  // ── Try Python .sav model first ──────────────────────────────────────────
  const pyResult = await runPythonInference({ disease_type, features: f });

  if (pyResult && typeof pyResult.probability === 'number') {
    proba = pyResult.probability;
    model_name = pyResult.model_name;
    console.log(`[ML] ${disease_type} → ${model_name}: probability=${proba}`);
  } else {
    // ── Fallback: calibrated logistic heuristic (diabetes only) ─────────
    console.warn('[ML] Falling back to heuristic (Python model unavailable)');
    const glucose = f.glucose || 100;
    const bmi = f.bmi || 25;
    const age = f.age || 30;
    const pedigree = f.diabetesPedigree || 0.4;
    const pregnancies = f.pregnancies || 0;
    const z =
      (glucose - 100) * 0.035 +
      (bmi - 25) * 0.09 +
      (age - 30) * 0.03 +
      (pedigree - 0.4) * 0.8 +
      (pregnancies - 2) * 0.08;
    proba = Math.max(0.02, Math.min(0.98, 1 / (1 + Math.exp(-z))));
    model_name = 'logistic_heuristic_fallback';
  }

  const risk_level = proba >= 0.70 ? 'high' : proba >= 0.40 ? 'moderate' : 'low';

  const predRecord = {
    prediction_id: 'PRED-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    patient_ref,
    disease_type,
    probability: Number(proba.toFixed(4)),
    risk_level,
    flags,
    model_name,
    model_source: pyResult ? 'trained_sav_model' : 'heuristic_fallback',
    created_at: new Date().toISOString()
  };

  PREDICTIONS_STORE.unshift(predRecord);
  res.json(predRecord);
});

// ─── GET /api/model-metrics/:disease ──────────────────────────────────────
// Real holdout evaluation metrics (accuracy/AUC/ROC/PR/feature importances)
// computed live from the trained .sav model against its original test split.
// Returns 404 when the model/dataset can't be evaluated (e.g. incomplete
// dataset) so the client falls back to precomputed static metrics.
// ──────────────────────────────────────────────────────────────────────────
app.get('/api/model-metrics/:disease', async (req, res) => {
  const disease = req.params.disease;
  if (!['diabetes', 'heart', 'parkinsons'].includes(disease)) {
    return res.status(400).json({ error: 'Unknown disease_type' });
  }

  const cached = METRICS_CACHE.get(disease);
  if (cached && Date.now() - cached.ts < METRICS_CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  const result = await runPythonEval(disease);
  if (!result) {
    return res.status(404).json({ error: 'Live model evaluation unavailable for this disease' });
  }

  METRICS_CACHE.set(disease, { data: result, ts: Date.now() });
  res.json(result);
});

// Alerts CRUD
app.get('/api/alerts', (req, res) => {
  res.json(ALERTS_STORE);
});

app.post('/api/alerts', (req, res) => {
  const newAlert = {
    id: 'ALT-' + Math.floor(1000 + Math.random() * 9000),
    ...req.body,
    status: req.body.status || 'OPEN',
    severity: req.body.probability >= 0.85 ? 'CRITICAL' : 'HIGH',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  ALERTS_STORE.unshift(newAlert);
  res.status(201).json(newAlert);
});

app.patch('/api/alerts/:id', (req, res) => {
  const { id } = req.params;
  const idx = ALERTS_STORE.findIndex((a) => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Alert not found' });

  ALERTS_STORE[idx] = {
    ...ALERTS_STORE[idx],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  res.json(ALERTS_STORE[idx]);
});

// Tasks CRUD
app.get('/api/tasks', (req, res) => {
  res.json(TASKS_STORE);
});

app.post('/api/tasks', (req, res) => {
  const newTask = {
    id: 'TSK-' + Math.floor(2000 + Math.random() * 8000),
    ...req.body,
    status: req.body.status || 'TODO',
    priority: req.body.priority || 'HIGH',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  TASKS_STORE.unshift(newTask);
  res.status(201).json(newTask);
});

app.patch('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const idx = TASKS_STORE.findIndex((t) => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });

  TASKS_STORE[idx] = {
    ...TASKS_STORE[idx],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  res.json(TASKS_STORE[idx]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  TASKS_STORE = TASKS_STORE.filter((t) => t.id !== id);
  res.json({ success: true, deleted_id: id });
});

// ----------------------------------------------------
// VITE SPA MIDDLEWARE / STATIC ASSETS
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Health Copilot Pro server listening on http://127.0.0.1:${PORT}`);
  });
}

startServer();
