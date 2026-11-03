import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'nirogx-super-secret-jwt-key-2026';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initialize Gemini AI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const CANDIDATE_MODELS = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

async function generateContentWithFallback(ai: GoogleGenAI, request: any) {
  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await ai.models.generateContent({
        ...request,
        model,
      });
      if (res && res.text) {
        return res;
      }
    } catch (err: any) {
      const isQuotaOrDemand =
        err?.status === 'RESOURCE_EXHAUSTED' ||
        err?.status === 'UNAVAILABLE' ||
        err?.error?.code === 429 ||
        err?.error?.code === 503 ||
        String(err?.message || '').includes('429') ||
        String(err?.message || '').includes('quota') ||
        String(err?.message || '').includes('503') ||
        String(err?.message || '').includes('high demand');
      
      if (isQuotaOrDemand) {
        // Quietly switch to next fallback model in the list
        continue;
      }
      // Non-quota error, move to next model or finish
      continue;
    }
  }
  return null;
}

// In-Memory Database matching NirogX SQLite Schema & Models
interface DBUser {
  id: number;
  name: string;
  email: string;
  hashed_password: string;
}

interface DBVital {
  id: number;
  user_id: number;
  type: string;
  value: number;
  unit: string;
  recorded_at: string;
}

interface DBBloodPressure {
  id: number;
  user_id: number;
  systolic: number;
  diastolic: number;
  recorded_at: string;
}

interface DBSleepSession {
  id: number;
  user_id: number;
  stage: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
}

interface DBChatMessage {
  id: number;
  user_id: number;
  session_id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  timestamp: string;
}

interface DBUserGoal {
  id: number;
  user_id: number;
  goal_type: string;
  target_value: number;
  updated_at: string;
}

interface DBMedicalHistory {
  id: number;
  user_id: number;
  condition: string;
  recorded_at: string;
}

// Initial Seed Data
const users: DBUser[] = [
  {
    id: 1,
    name: 'Soham User',
    email: 'user@nirogx.ai',
    hashed_password: bcrypt.hashSync('nirogx123', 10),
  },
];

const vitals: DBVital[] = [
  { id: 1, user_id: 1, type: 'heart_rate', value: 68, unit: 'bpm', recorded_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: 2, user_id: 1, type: 'SpO2', value: 98.5, unit: '%', recorded_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: 3, user_id: 1, type: 'body_temp', value: 36.6, unit: '°C', recorded_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: 4, user_id: 1, type: 'glucose', value: 95, unit: 'mg/dL', recorded_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { id: 5, user_id: 1, type: 'steps', value: 6420, unit: 'steps', recorded_at: new Date().toISOString() },
];

const bloodPressures: DBBloodPressure[] = [
  { id: 1, user_id: 1, systolic: 118, diastolic: 78, recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 2, user_id: 1, systolic: 120, diastolic: 80, recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
];

const sleepSessions: DBSleepSession[] = [
  {
    id: 1,
    user_id: 1,
    stage: 'Deep / REM',
    duration_minutes: 460,
    start_time: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
    end_time: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
  },
];

const chatMessages: DBChatMessage[] = [
  {
    id: 1,
    user_id: 1,
    session_id: 'default-session-1',
    role: 'user',
    text: 'Hello NirogX! How is my heart rate and sleep looking today?',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    session_id: 'default-session-1',
    role: 'model',
    text: 'Hello! Based on your recent biometrics, your resting heart rate is at a healthy 68 bpm, and your sleep duration was approximately 7.7 hours. Keep staying hydrated and maintain your active routine. (Note: I am an AI assistant, not a doctor).',
    timestamp: new Date(Date.now() - 1000 * 60 * 19).toISOString(),
  },
];

const userGoals: DBUserGoal[] = [
  { id: 1, user_id: 1, goal_type: 'Hydration', target_value: 2.5, updated_at: new Date().toISOString() },
  { id: 2, user_id: 1, goal_type: 'Daily Walk', target_value: 30, updated_at: new Date().toISOString() },
  { id: 3, user_id: 1, goal_type: 'Sleep Prep', target_value: 1, updated_at: new Date().toISOString() },
];

const medicalHistories: DBMedicalHistory[] = [
  { id: 1, user_id: 1, condition: 'Mild Seasonal Allergies', recorded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() },
];

let nextId = 100;

// Auth Middleware Helper
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Default to guest/demo user 1 if not strictly provided
    (req as any).userId = 1;
    return next();
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY) as { sub: string };
    (req as any).userId = parseInt(payload.sub, 10) || 1;
    next();
  } catch (err) {
    (req as any).userId = 1;
    next();
  }
}

// -------------------------------------------------------------
// Health Score Calculator (Exact logic from health_score_calculator.py)
// -------------------------------------------------------------
class HealthScoreCalculator {
  static OPTIMAL_BMI = 22.0;
  static OPTIMAL_HR = 65.0;
  static OPTIMAL_SLEEP = 8.0;

  static MAX_AGE_SCORE = 20.0;
  static MAX_BMI_SCORE = 20.0;
  static MAX_HR_SCORE = 20.0;
  static MAX_SLEEP_SCORE = 15.0;
  static MAX_ACTIVITY_SCORE = 25.0;

  static ACTIVITY_SCORES: Record<string, number> = {
    sedentary: 5.0,
    light: 10.0,
    moderate: 15.0,
    active: 20.0,
    very_active: 25.0,
  };

  static calculateScore(vitalsData: { age: number; bmi: number; heart_rate: number; sleep_hours: number; activity_level: string }) {
    // 1. Age Score
    let age_score = 10.0;
    if (vitalsData.age <= 30) age_score = 20.0;
    else if (vitalsData.age <= 45) age_score = 18.0;
    else if (vitalsData.age <= 60) age_score = 15.0;
    else if (vitalsData.age <= 75) age_score = 12.0;

    // 2. BMI Score
    const bmi_penalty = Math.abs(vitalsData.bmi - this.OPTIMAL_BMI) * 2.0;
    const bmi_score = Math.max(0.0, this.MAX_BMI_SCORE - bmi_penalty);

    // 3. Heart Rate Score
    const hr_penalty = Math.abs(vitalsData.heart_rate - this.OPTIMAL_HR) * 0.5;
    const hr_score = Math.max(0.0, this.MAX_HR_SCORE - hr_penalty);

    // 4. Sleep Score
    const sleep_penalty = Math.abs(vitalsData.sleep_hours - this.OPTIMAL_SLEEP) * 4.0;
    const sleep_score = Math.max(0.0, this.MAX_SLEEP_SCORE - sleep_penalty);

    // 5. Activity Score
    const activity_score = this.ACTIVITY_SCORES[vitalsData.activity_level] ?? 15.0;

    // Aggregate
    let total_score = age_score + bmi_score + hr_score + sleep_score + activity_score;
    total_score = Math.max(0.0, Math.min(100.0, total_score));

    return {
      total: Math.round(total_score * 100) / 100,
      breakdown: {
        age_score: Math.round(age_score * 10) / 10,
        bmi_score: Math.round(bmi_score * 10) / 10,
        hr_score: Math.round(hr_score * 10) / 10,
        sleep_score: Math.round(sleep_score * 10) / 10,
        activity_score: Math.round(activity_score * 10) / 10,
      },
    };
  }

  static getStatusCategory(score: number): 'Optimal' | 'Good' | 'Caution' | 'Critical' {
    if (score >= 80.0) return 'Optimal';
    if (score >= 60.0) return 'Good';
    if (score >= 40.0) return 'Caution';
    return 'Critical';
  }

  static calculateFullProfile(vitalsData: { age: number; bmi: number; heart_rate: number; sleep_hours: number; activity_level: string }) {
    const { total, breakdown } = this.calculateScore(vitalsData);
    const status = this.getStatusCategory(total);
    return {
      score: total,
      status,
      breakdown,
    };
  }
}

// -------------------------------------------------------------
// API Endpoints (Replicating NirogX FastAPI Backend)
// -------------------------------------------------------------

// 1. Root / Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', message: 'Welcome to the NirogX API' });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'online', message: 'Welcome to the NirogX API' });
});

// 2. Auth: Signup
app.post('/api/v1/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password are required' });
  }

  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ detail: 'Email already registered' });
  }

  const newUser: DBUser = {
    id: ++nextId,
    name: name || email.split('@')[0],
    email: email.toLowerCase(),
    hashed_password: bcrypt.hashSync(password, 10),
  };
  users.push(newUser);

  const token = jwt.sign({ sub: String(newUser.id) }, SECRET_KEY, { expiresIn: '30d' });
  res.json({ token, user_id: newUser.id, name: newUser.name });
});

// 3. Auth: Login
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.hashed_password)) {
    return res.status(401).json({ detail: 'Invalid email or password' });
  }

  const token = jwt.sign({ sub: String(user.id) }, SECRET_KEY, { expiresIn: '30d' });
  res.json({ token, user_id: user.id, name: user.name });
});

// 4. Health Score calculation endpoint
app.post('/api/v1/health-score', (req, res) => {
  try {
    const { age = 28, bmi = 22.5, heart_rate = 68, sleep_hours = 7.5, activity_level = 'moderate' } = req.body;
    const result = HealthScoreCalculator.calculateFullProfile({
      age: Number(age),
      bmi: Number(bmi),
      heart_rate: Number(heart_rate),
      sleep_hours: Number(sleep_hours),
      activity_level: String(activity_level),
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ detail: err.message || 'Error calculating health score' });
  }
});

// 5. Structured Symptom Analysis with AI (Clinical Assessment)
app.post('/api/v1/analyze', authenticateToken, async (req, res) => {
  const { text, duration, user_id } = req.body;
  const targetUserId = (req as any).userId || (user_id ? parseInt(user_id, 10) : 1);

  if (!text || text.length < 3) {
    return res.status(400).json({ detail: 'Please provide a descriptive symptom.' });
  }

  // Gather user biometrics for RAG context
  const userVitals = vitals.filter((v) => v.user_id === targetUserId);
  const userBP = bloodPressures.filter((b) => b.user_id === targetUserId);
  const userMedHistory = medicalHistories.filter((m) => m.user_id === targetUserId);

  const biometricSummary = [
    ...userVitals.map((v) => `${v.type}: ${v.value} ${v.unit}`),
    ...userBP.map((b) => `BP: ${b.systolic}/${b.diastolic} mmHg`),
  ].slice(-5).join(', ') || 'No recent biometric data available';

  const historySummary = userMedHistory.map((m) => m.condition).join(', ') || 'None recorded';

  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `You are 'NirogX', an AI medical assistant. Your role is to provide a preliminary, evidence-based clinical assessment based on the user's symptoms and their recent biometric data. Do not provide a definitive diagnosis. Always advise the user to consult a medical professional. Output JSON ONLY with schema:
      {
        "assessment": string (a comprehensive yet concise preliminary clinical analysis of the symptom, potential causes, and practical self-care or observation advice),
        "red_flags": string[] (list of critical warning signs or emergency scenarios requiring immediate medical attention, or empty array if none),
        "confidence_score": number (between 0.0 and 1.0)
      }

      User Reported Symptoms: "${text}"
      Symptom Duration: "${duration || 'Unknown'}"
      Recent Biometrics Context: ${biometricSummary}
      Medical History: ${historySummary}`;

      const response = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              assessment: { type: Type.STRING },
              red_flags: { type: Type.ARRAY, items: { type: Type.STRING } },
              confidence_score: { type: Type.NUMBER },
            },
            required: ['assessment', 'red_flags', 'confidence_score'],
          },
        },
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        return res.json({
          assessment: parsed.assessment || 'Analysis generated based on reported symptoms.',
          red_flags: parsed.red_flags || [],
          confidence_score: typeof parsed.confidence_score === 'number' ? parsed.confidence_score : 0.88,
        });
      }
    } catch (_) {
      // Proceed to clinical rule-based assessment fallback
    }
  }

  // Clinical Rule-Based Fallback
  const lower = text.toLowerCase();
  const redFlags: string[] = [];
  let assessment = `Based on your reported symptoms ("${text}") persisting for ${duration || 'an unspecified time'}, `;

  if (lower.includes('chest pain') || lower.includes('shortness of breath') || lower.includes('radiating')) {
    redFlags.push('Chest pain or shortness of breath requires urgent medical evaluation');
    redFlags.push('Seek immediate emergency care if accompanied by dizziness or sweating');
    assessment += 'this could indicate acute cardiopulmonary strain. Immediate professional medical assessment is strongly advised.';
  } else if (lower.includes('headache') || lower.includes('fever') || lower.includes('migraine')) {
    if (lower.includes('fever')) redFlags.push('High fever above 39°C or lasting > 3 days requires a physician visit');
    assessment += 'symptoms may be related to tension, dehydration, or a viral upper respiratory response. Ensure adequate rest, hydration, and monitor temperature.';
  } else if (lower.includes('stomach') || lower.includes('nausea') || lower.includes('cramp')) {
    assessment += 'symptoms suggest gastrointestinal sensitivity. Consider light bland diet, electrolytes, and consult a doctor if severe vomiting or localized sharp pain develops.';
  } else {
    assessment += 'we recommend monitoring symptom progression, maintaining hydration and rest, and consulting a healthcare practitioner if symptoms worsen or persist.';
  }

  res.json({
    assessment,
    red_flags: redFlags,
    confidence_score: 0.85,
  });
});

// 6. RAG-Enabled AI Chat with Memory & Medical Context
app.post('/api/v1/chat', authenticateToken, async (req, res) => {
  const userId = (req as any).userId || 1;
  const { prompt, session_id = 'default', image } = req.body;

  if (!prompt && !image) {
    return res.status(400).json({ detail: 'Prompt or image is required' });
  }

  const effectivePrompt = prompt || 'Please analyze this medical document/image.';

  // 1. Save user message
  const userMsg: DBChatMessage = {
    id: ++nextId,
    user_id: userId,
    session_id,
    role: 'user',
    text: effectivePrompt,
    image: image || undefined,
    timestamp: new Date().toISOString(),
  };
  chatMessages.push(userMsg);

  // 2. Fetch past messages for this session
  const pastSessionMessages = chatMessages.filter((m) => m.session_id === session_id && m.id !== userMsg.id);

  // 3. RAG Augmentation: Recent Vitals, Medical History, Goals
  const userVitals = vitals.filter((v) => v.user_id === userId).slice(-5);
  const vitalsText = userVitals.length
    ? userVitals.map((v) => `- ${v.type}: ${v.value} ${v.unit} (recorded ${v.recorded_at})`).join('\n')
    : 'None reported';

  const medHistory = medicalHistories.filter((m) => m.user_id === userId);
  const medText = medHistory.length ? medHistory.map((m) => m.condition).join(', ') : 'None reported';

  const goals = userGoals.filter((g) => g.user_id === userId);
  const goalsText = goals.length ? goals.map((g) => `${g.goal_type}: ${g.target_value}`).join(', ') : 'None set';

  const contextBlock = `
[SYSTEM CLINICAL CONTEXT - USE THIS TO PERSONALIZE ANSWERS]
USER VITALS:
${vitalsText}

KNOWN MEDICAL HISTORY:
${medText}

ACTIVE HEALTH GOALS:
${goalsText}
`;

  const ai = getGeminiClient();

  if (ai) {
    try {
      const systemInstruction =
        "You are NirogX, an empathetic and highly knowledgeable clinical AI health assistant. " +
        "Answer the user's question directly, clearly, and concisely using evidence-based health guidance. " +
        "Use the provided biometric database vitals and medical history to personalize your answer if relevant. " +
        "Always include a brief disclaimer that you are an AI assistant and not a replacement for a certified physician.";

      const contents: any[] = [];

      // Add conversation history
      for (const msg of pastSessionMessages.slice(-6)) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }

      // Add current augmented turn
      const currentParts: any[] = [{ text: effectivePrompt + '\n\n' + contextBlock }];

      if (image && typeof image === 'string' && image.startsWith('data:')) {
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          currentParts.unshift({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
        }
      }

      contents.push({
        role: 'user',
        parts: currentParts,
      });

      const response = await generateContentWithFallback(ai, {
        contents,
        config: {
          systemInstruction,
        },
      });

      if (response && response.text) {
        const replyText = response.text;
        const aiMsg: DBChatMessage = {
          id: ++nextId,
          user_id: userId,
          session_id,
          role: 'model',
          text: replyText,
          timestamp: new Date().toISOString(),
        };
        chatMessages.push(aiMsg);

        return res.json({ status: 'success', response: replyText });
      }
    } catch (_) {
      // Proceed to rule-based fallback response
    }
  }

  // Fallback AI Response
  let fallbackReply = `Hello! Based on your health record (Heart rate: 68 bpm, BP: 120/80), here is information regarding your query: "${effectivePrompt}". `;
  fallbackReply += "Stay hydrated, maintain consistent sleep patterns, and consult your primary healthcare provider for specific diagnostic evaluations. (Disclaimer: I am NirogX AI, not a physician).";

  const aiMsg: DBChatMessage = {
    id: ++nextId,
    user_id: userId,
    session_id,
    role: 'model',
    text: fallbackReply,
    timestamp: new Date().toISOString(),
  };
  chatMessages.push(aiMsg);

  res.json({ status: 'success', response: fallbackReply });
});

// 7. Chat History Endpoint
app.get('/api/v1/chat/history', authenticateToken, (req, res) => {
  const userId = (req as any).userId || 1;
  const userChatMessages = chatMessages.filter((m) => m.user_id === userId);

  const sessions: Record<string, { role: 'user' | 'model'; text: string; timestamp: string; image?: string }[]> = {};

  for (const msg of userChatMessages) {
    if (!sessions[msg.session_id]) {
      sessions[msg.session_id] = [];
    }
    sessions[msg.session_id].push({
      role: msg.role,
      text: msg.text,
      image: msg.image,
      timestamp: msg.timestamp,
    });
  }

  res.json({ status: 'success', sessions });
});

// 8. AI Coach: Action Plan Generation
app.get('/api/v1/action-plan', authenticateToken, async (req, res) => {
  const userId = (req as any).userId || 1;
  const recentVitals = vitals.filter((v) => v.user_id === userId).slice(-10);
  const recentChats = chatMessages.filter((m) => m.user_id === userId).slice(-5);

  const vitalsCtx = recentVitals.map((v) => `${v.type}: ${v.value}`).join(', ') || 'Normal baseline';
  const chatCtx = recentChats.map((m) => `${m.role}: ${m.text.slice(0, 50)}`).join(' | ') || 'General health wellness';

  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `Analyze this user's health context:
      VITALS: ${vitalsCtx}
      RECENT CHAT: ${chatCtx}
      Output a JSON array of EXACTLY 3 daily health goals.
      Use these fields: id (string), title (short), subtitle (short explanation), unit, iconName (droplets, moon, footprints, or pill), color (hex string starting with # or 0xFF), currentValue (number), targetValue (number), isManual (boolean).
      Target values should be realistic. If hydration is needed, use 'L' and target 2.5.`;

      const response = await generateContentWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                unit: { type: Type.STRING },
                iconName: { type: Type.STRING },
                color: { type: Type.STRING },
                currentValue: { type: Type.NUMBER },
                targetValue: { type: Type.NUMBER },
                isManual: { type: Type.BOOLEAN },
              },
              required: ['id', 'title', 'unit', 'iconName', 'color', 'currentValue', 'targetValue', 'isManual'],
            },
          },
        },
      });

      if (response && response.text) {
        const goals = JSON.parse(response.text);
        if (Array.isArray(goals) && goals.length > 0) {
          return res.json({ status: 'success', goals });
        }
      }
    } catch (_) {
      // Use fallback daily clinical action goals
    }
  }

  // Fallback standard goals
  res.json({
    status: 'fallback',
    goals: [
      {
        id: 'f1',
        title: 'Hydration',
        subtitle: 'Optimal daily water balance',
        unit: 'L',
        iconName: 'droplets',
        color: '#00C9B7',
        currentValue: 1.8,
        targetValue: 2.5,
        isManual: true,
      },
      {
        id: 'f2',
        title: 'Daily Walk',
        subtitle: 'Low-impact cardiovascular activity',
        unit: 'mins',
        iconName: 'footprints',
        color: '#4CAF50',
        currentValue: 22,
        targetValue: 30,
        isManual: false,
      },
      {
        id: 'f3',
        title: 'Sleep Prep',
        subtitle: 'Wind down 30 mins before rest',
        unit: 'Sessions',
        iconName: 'moon',
        color: '#3F51B5',
        currentValue: 1,
        targetValue: 1,
        isManual: true,
      },
    ],
  });
});

// 9. Vitals: Get all vitals
app.get('/api/v1/vitals', authenticateToken, (req, res) => {
  const userId = (req as any).userId || 1;
  const userVitals = vitals.filter((v) => v.user_id === userId).sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
  const userBP = bloodPressures.filter((b) => b.user_id === userId).sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
  const userSleep = sleepSessions.filter((s) => s.user_id === userId).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  res.json({
    status: 'success',
    data: userVitals,
    blood_pressure: userBP,
    sleep: userSleep,
  });
});

// 10. Vitals: Log manual vital
app.post('/api/v1/vitals/manual', authenticateToken, (req, res) => {
  const userId = (req as any).userId || 1;
  const { type, value, unit } = req.body;

  if (!type || value === undefined) {
    return res.status(400).json({ detail: 'Type and value are required' });
  }

  const newVital: DBVital = {
    id: ++nextId,
    user_id: userId,
    type,
    value: Number(value),
    unit: unit || '',
    recorded_at: new Date().toISOString(),
  };
  vitals.unshift(newVital);

  res.json({ status: 'success', data: newVital });
});

// 11. Sync Vitals (Wearable / Health Connect)
app.post('/api/vitals/sync', authenticateToken, (req, res) => {
  const userId = (req as any).userId || 1;
  const { device_os, vitals: syncVitals, blood_pressure: syncBP, sleep_sessions: syncSleep } = req.body;

  if (Array.isArray(syncVitals)) {
    for (const v of syncVitals) {
      vitals.unshift({
        id: ++nextId,
        user_id: userId,
        type: v.type,
        value: Number(v.value),
        unit: v.unit || '',
        recorded_at: v.recorded_at || new Date().toISOString(),
      });
    }
  }

  if (Array.isArray(syncBP)) {
    for (const bp of syncBP) {
      bloodPressures.unshift({
        id: ++nextId,
        user_id: userId,
        systolic: Number(bp.systolic),
        diastolic: Number(bp.diastolic),
        recorded_at: bp.recorded_at || new Date().toISOString(),
      });
    }
  }

  if (Array.isArray(syncSleep)) {
    for (const s of syncSleep) {
      sleepSessions.unshift({
        id: ++nextId,
        user_id: userId,
        stage: s.stage || 'Deep',
        duration_minutes: Number(s.duration_minutes || 480),
        start_time: s.start_time || new Date().toISOString(),
        end_time: s.end_time || new Date().toISOString(),
      });
    }
  }

  res.json({
    status: 'success',
    message: `Successfully synchronized health data from ${device_os || 'Wearable Device'}`,
  });
});

// 12. Profile: Medical History
app.get('/api/v1/profile/medical-history', authenticateToken, (req, res) => {
  const userId = (req as any).userId || 1;
  const history = medicalHistories.filter((m) => m.user_id === userId);
  res.json({ status: 'success', data: history });
});

app.post('/api/v1/profile/medical-history', authenticateToken, (req, res) => {
  const userId = (req as any).userId || 1;
  const { condition } = req.body;
  if (!condition) return res.status(400).json({ detail: 'Condition is required' });

  const item: DBMedicalHistory = {
    id: ++nextId,
    user_id: userId,
    condition,
    recorded_at: new Date().toISOString(),
  };
  medicalHistories.push(item);
  res.json({ status: 'success', data: item });
});

// Normalized Health Data Points Model
interface DBHealthDataPoint {
  id: string;
  user_id: number;
  metric_type: string;
  value: number;
  value_secondary?: number;
  unit: string;
  start_time: string;
  end_time: string;
  source: string;
  platform: 'android' | 'ios' | 'web' | 'manual';
  metadata?: string;
  sync_timestamp: string;
}

interface DBHealthScoreHistory {
  id: string;
  user_id: number;
  date: string;
  overall_score: number;
  activity_score: number;
  sleep_score: number;
  heart_score: number;
  recovery_score: number;
  hydration_score: number;
  data_completeness: number;
}

const normalizedHealthStore: DBHealthDataPoint[] = [];
const healthScoreHistoryStore: DBHealthScoreHistory[] = [];
const userSyncStates = new Map<number, { lastSyncTime: string | null; platform: string; device: string }>();

// Seed initial historical health scores for demo user
const seedDates = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
seedDates.forEach((day, idx) => {
  healthScoreHistoryStore.push({
    id: `score_hist_${idx}`,
    user_id: 1,
    date: day,
    overall_score: [79, 81, 80, 83, 82, 85, 84][idx],
    activity_score: [75, 80, 78, 88, 82, 90, 85][idx],
    sleep_score: [82, 78, 84, 80, 85, 92, 88][idx],
    heart_score: [85, 86, 84, 88, 86, 89, 88][idx],
    recovery_score: [80, 82, 81, 84, 83, 88, 86][idx],
    hydration_score: [70, 75, 80, 75, 85, 90, 85][idx],
    data_completeness: 100,
  });
});

// 13. Profile: Goals
app.get('/api/v1/profile/goals', authenticateToken, (req, res) => {
  const userId = (req as any).userId || 1;
  const goals = userGoals.filter((g) => g.user_id === userId);
  res.json({ status: 'success', data: goals });
});

app.post('/api/v1/profile/goals', authenticateToken, (req, res) => {
  const userId = (req as any).userId || 1;
  const { goal_type, target_value } = req.body;
  if (!goal_type || target_value === undefined) {
    return res.status(400).json({ detail: 'goal_type and target_value are required' });
  }

  const existing = userGoals.find((g) => g.user_id === userId && g.goal_type.toLowerCase() === goal_type.toLowerCase());
  if (existing) {
    existing.target_value = Number(target_value);
    existing.updated_at = new Date().toISOString();
  } else {
    userGoals.push({
      id: ++nextId,
      user_id: userId,
      goal_type,
      target_value: Number(target_value),
      updated_at: new Date().toISOString(),
    });
  }

  res.json({ status: 'success' });
});

// -------------------------------------------------------------
// UNIFIED HEALTH CONNECT & HEALTHKIT SYNC ENDPOINTS
// -------------------------------------------------------------

// Get Health Sync Status & Cursor
app.get('/api/v1/health-sync/status', authenticateToken, (req, res) => {
  const userId = (req as any).userId || 1;
  const state = userSyncStates.get(userId) || {
    lastSyncTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    platform: 'health_connect',
    device: 'Android Health Connect • Galaxy Watch 6',
  };

  const userRecords = normalizedHealthStore.filter((r) => r.user_id === userId);

  res.json({
    status: 'success',
    isConnected: true,
    platform: state.platform,
    device: state.device,
    lastSuccessfulSyncTime: state.lastSyncTime,
    totalRecords: userRecords.length,
    sources: ['Health Connect', 'Apple Health', 'Galaxy Watch 6', 'Manual Entry'],
  });
});

// Incremental Health Sync Ingestion
app.post('/api/v1/health-sync/sync', authenticateToken, (req, res) => {
  const userId = (req as any).userId || 1;
  const { platform = 'health_connect', device = 'Health Connect', records = [], cursor } = req.body;

  let newCount = 0;
  let duplicateCount = 0;
  const nowStr = new Date().toISOString();

  if (Array.isArray(records)) {
    for (const rec of records) {
      const id = rec.id || `dp_${rec.source}_${rec.metricType}_${rec.startTime}_${rec.value}`;
      const exists = normalizedHealthStore.some((existing) => existing.id === id && existing.user_id === userId);

      if (exists) {
        duplicateCount++;
      } else {
        newCount++;
        normalizedHealthStore.unshift({
          id,
          user_id: userId,
          metric_type: rec.metricType || rec.metric_type,
          value: Number(rec.value),
          value_secondary: rec.valueSecondary ? Number(rec.valueSecondary) : undefined,
          unit: rec.unit || '',
          start_time: rec.startTime || rec.start_time || nowStr,
          end_time: rec.endTime || rec.end_time || nowStr,
          source: rec.source || device,
          platform: rec.platform || 'android',
          metadata: rec.metadata ? JSON.stringify(rec.metadata) : undefined,
          sync_timestamp: nowStr,
        });
      }
    }
  }

  userSyncStates.set(userId, {
    lastSyncTime: nowStr,
    platform,
    device,
  });

  res.json({
    status: 'success',
    newRecordsImported: newCount,
    duplicatesSkipped: duplicateCount,
    cursor: nowStr,
    timestamp: nowStr,
  });
});

// Disconnect Health Data & Privacy Purge
app.post('/api/v1/health-sync/disconnect', authenticateToken, (req, res) => {
  const userId = (req as any).userId || 1;
  const { purgeData = false } = req.body;

  if (purgeData) {
    const initialLen = normalizedHealthStore.length;
    for (let i = normalizedHealthStore.length - 1; i >= 0; i--) {
      if (normalizedHealthStore[i].user_id === userId) {
        normalizedHealthStore.splice(i, 1);
      }
    }
  }

  userSyncStates.delete(userId);

  res.json({
    status: 'success',
    message: purgeData ? 'Health platform disconnected and synchronized data permanently deleted.' : 'Health platform disconnected.',
  });
});

// Get Normalized Health Time-Series Data (Today, 7D, 30D, 90D)
app.get('/api/v1/health/normalized-data', authenticateToken, (req, res) => {
  const userId = (req as any).userId || 1;
  const { metric_type, range = '7d' } = req.query;

  let points = normalizedHealthStore.filter((p) => p.user_id === userId);
  if (metric_type) {
    points = points.filter((p) => p.metric_type === metric_type);
  }

  res.json({
    status: 'success',
    data: points,
    timeRange: range,
    count: points.length,
  });
});

// Get Historical Health Score Trend
app.get('/api/v1/health/score/history', authenticateToken, (req, res) => {
  const userId = (req as any).userId || 1;
  const history = healthScoreHistoryStore.filter((h) => h.user_id === userId);

  res.json({
    status: 'success',
    history,
  });
});


// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api') || (req.path.includes('.') && req.path !== '/index.html')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        console.error('[DevServer] Error serving index.html:', e);
        if (vite) vite.ssrFixStacktrace(e);
        next(e);
      }
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
    console.log(`NirogX Server running on http://localhost:${PORT}`);
  });
}

startServer();
