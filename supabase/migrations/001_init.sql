-- ==============================================================================
-- Migration: 001_init.sql
-- App: AI Health Copilot Pro (PostgreSQL / Supabase Schema)
-- Author: Dr. Harry Patria, Chief Data & AI Officer, Patria & Co.
-- Version: 3.1.0 | Framework: ITDO Framework (Insights -> Triggers -> Decisions -> Operations)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_ref TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    age INT NOT NULL CHECK (age >= 0 AND age <= 130),
    gender TEXT CHECK (gender IN ('FEMALE', 'MALE', 'OTHER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Predictions Table (Insights Layer)
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    disease_type TEXT NOT NULL DEFAULT 'diabetes_type_2',
    probability NUMERIC(5, 4) NOT NULL CHECK (probability >= 0 AND probability <= 1),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high')),
    flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    feature_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    key_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendation TEXT NOT NULL,
    disclaimer TEXT NOT NULL,
    model_version TEXT NOT NULL DEFAULT '3.1.0',
    model_name TEXT NOT NULL DEFAULT 'RandomForestClassifier_Pipeline',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Alerts Table (Triggers Layer)
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID REFERENCES public.predictions(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    threshold NUMERIC(5, 4) NOT NULL DEFAULT 0.7000,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),
    severity TEXT NOT NULL DEFAULT 'HIGH' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    assigned_to UUID,
    assigned_name TEXT DEFAULT 'Clinical Triage Team',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tasks Table (Decisions & Operations Layer)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID REFERENCES public.alerts(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    intervention TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED')),
    priority TEXT NOT NULL DEFAULT 'HIGH' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    due_date DATE NOT NULL,
    assigned_to UUID,
    assigned_name TEXT DEFAULT 'Care Coordinator',
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for rapid querying & triage dashboards
CREATE INDEX IF NOT EXISTS idx_patients_ref ON public.patients(patient_ref);
CREATE INDEX IF NOT EXISTS idx_predictions_patient ON public.predictions(patient_id);
CREATE INDEX IF NOT EXISTS idx_predictions_risk ON public.predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON public.predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_prediction ON public.alerts(prediction_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- Row Level Security (RLS) policies
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated and clinical users access
CREATE POLICY "Allow clinical read access to patients" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Allow clinical write access to patients" ON public.patients FOR ALL USING (true);

CREATE POLICY "Allow clinical read access to predictions" ON public.predictions FOR SELECT USING (true);
CREATE POLICY "Allow clinical write access to predictions" ON public.predictions FOR ALL USING (true);

CREATE POLICY "Allow clinical read access to alerts" ON public.alerts FOR SELECT USING (true);
CREATE POLICY "Allow clinical write access to alerts" ON public.alerts FOR ALL USING (true);

CREATE POLICY "Allow clinical read access to tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow clinical write access to tasks" ON public.tasks FOR ALL USING (true);
