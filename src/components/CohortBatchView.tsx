import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Upload, 
  Play, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Download,
  Filter,
  Search
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip 
} from 'recharts';
import { predictDiabetesProbability } from '../lib/ml-engine';
import { flagDiabetesFeatures } from '../lib/deterministic-flags';

interface CohortBatchViewProps {
  onSelectPatientToScreen?: (features: any) => void;
}

export const CohortBatchView: React.FC<CohortBatchViewProps> = ({ onSelectPatientToScreen }) => {
  const [datasetRows, setDatasetRows] = useState<any[]>([]);
  const [processedBatch, setProcessedBatch] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/dataset/sample')
      .then((res) => res.json())
      .then((data) => {
        if (data.sample_rows) {
          setDatasetRows(data.sample_rows);
          // Run batch prediction on dataset sample
          const processed = data.sample_rows.map((row: any, idx: number) => {
            const features = {
              pregnancies: row.Pregnancies || 0,
              glucose: row.Glucose || 0,
              bloodPressure: row.BloodPressure || 0,
              skinThickness: row.SkinThickness || 0,
              insulin: row.Insulin || 0,
              bmi: row.BMI || 0,
              diabetesPedigree: row.DiabetesPedigreeFunction || 0.4,
              age: row.Age || 30
            };
            const pred = predictDiabetesProbability(features);
            const flags = flagDiabetesFeatures(features).flags;

            return {
              id: `PIMA-${String(idx + 1).padStart(3, '0')}`,
              ...row,
              features,
              probability: pred.probability,
              risk_level: pred.risk_level,
              flags_count: flags.length,
              flags
            };
          });
          setProcessedBatch(processed);
        }
      })
      .catch((err) => console.error('Failed to load dataset sample:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredRows = processedBatch.filter((row) => {
    const matchesRisk = riskFilter === 'ALL' || row.risk_level === riskFilter.toLowerCase();
    const matchesSearch =
      row.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(row.Age).includes(searchTerm);
    return matchesRisk && matchesSearch;
  });

  const highCount = processedBatch.filter((r) => r.risk_level === 'high').length;
  const modCount = processedBatch.filter((r) => r.risk_level === 'moderate').length;
  const lowCount = processedBatch.filter((r) => r.risk_level === 'low').length;

  const pieData = [
    { name: 'High Risk (≥70%)', value: highCount, color: '#f43f5e' },
    { name: 'Moderate Risk (40-69%)', value: modCount, color: '#f59e0b' },
    { name: 'Low Risk (<40%)', value: lowCount, color: '#10b981' }
  ];

  const handleExportCSV = () => {
    if (processedBatch.length === 0) return;
    const headers = ['PatientID', 'Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age', 'PredictedProbability', 'RiskLevel', 'FlagsCount'];
    const csvContent = [
      headers.join(','),
      ...processedBatch.map((r) => [
        r.id,
        r.Pregnancies,
        r.Glucose,
        r.BloodPressure,
        r.SkinThickness,
        r.Insulin,
        r.BMI,
        r.DiabetesPedigreeFunction,
        r.Age,
        (r.probability * 100).toFixed(1) + '%',
        r.risk_level.toUpperCase(),
        r.flags_count
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ai_health_copilot_batch_screening.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 tracking-wider">
                Batch Inference & Dataset Explorer
              </span>
              <span className="text-xs text-slate-500 font-medium">Cohort Screening Pipeline</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 uppercase tracking-tight">Population Health Risk Stratification</h2>
            <p className="text-xs text-slate-500">
              High-throughput ML pipeline processing clinical records from the Pima Indians Diabetes Dataset.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all uppercase tracking-wider"
          >
            <Download className="w-4 h-4 text-teal-700" />
            <span>Export Batch CSV</span>
          </button>
        </div>
      </div>

      {/* Cohort Summary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Metric Cards (7 Cols) */}
        <div className="lg:col-span-7 grid grid-cols-3 gap-4">
          <div className="bg-red-50/50 border border-red-200 rounded-xl p-4 shadow-sm text-center">
            <span className="text-[10px] uppercase font-mono text-red-700 font-bold tracking-wider block">High Risk Cohort</span>
            <span className="text-3xl font-black text-red-950 font-mono mt-1 block">{highCount}</span>
            <span className="text-[10px] text-red-700 mt-1 block font-medium">Require Immediate Triage</span>
          </div>

          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 shadow-sm text-center">
            <span className="text-[10px] uppercase font-mono text-amber-800 font-bold tracking-wider block">Moderate Risk</span>
            <span className="text-3xl font-black text-amber-950 font-mono mt-1 block">{modCount}</span>
            <span className="text-[10px] text-amber-800 mt-1 block font-medium">Lifestyle Intervention</span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 shadow-sm text-center">
            <span className="text-[10px] uppercase font-mono text-emerald-800 font-bold tracking-wider block">Low Risk Control</span>
            <span className="text-3xl font-black text-emerald-950 font-mono mt-1 block">{lowCount}</span>
            <span className="text-[10px] text-emerald-800 mt-1 block font-medium">Annual Screening</span>
          </div>

          <div className="col-span-3 bg-white border border-slate-200 rounded-xl p-4 text-xs text-slate-700 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-teal-700" />
              <span>Dataset Loaded: <strong>Pima Indians Diabetes Cohort (768 total records)</strong></span>
            </div>
            <span className="font-mono text-teal-700 font-bold">{processedBatch.length} Sampled & Stratified</span>
          </div>
        </div>

        {/* Donut Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="h-36 w-36 relative flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px', color: '#0f172a' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs flex-1 ml-4">
            <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold tracking-wider">Cohort Distribution</span>
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dataset Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* Filters bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Risk Filter:</span>
            {['ALL', 'HIGH', 'MODERATE', 'LOW'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setRiskFilter(lvl)}
                className={`text-xs px-3 py-1 rounded-lg font-mono font-bold transition-all uppercase tracking-wider ${
                  riskFilter === lvl
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:text-slate-900'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID or Age..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 w-full focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="p-3 font-bold uppercase tracking-wider">Patient Ref</th>
                <th className="p-3 font-bold uppercase tracking-wider">Glucose</th>
                <th className="p-3 font-bold uppercase tracking-wider">BMI</th>
                <th className="p-3 font-bold uppercase tracking-wider">Age</th>
                <th className="p-3 font-bold uppercase tracking-wider">Insulin</th>
                <th className="p-3 font-bold uppercase tracking-wider">Diastolic BP</th>
                <th className="p-3 font-bold uppercase tracking-wider">Pedigree</th>
                <th className="p-3 font-bold uppercase tracking-wider">Flags</th>
                <th className="p-3 font-bold uppercase tracking-wider">ML Probability</th>
                <th className="p-3 font-bold uppercase tracking-wider">Risk Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-teal-700">{row.id}</td>
                  <td className={`p-3 font-mono font-bold ${row.Glucose > 99 ? 'text-red-600' : 'text-slate-700'}`}>
                    {row.Glucose} mg/dL
                  </td>
                  <td className={`p-3 font-mono font-bold ${row.BMI >= 30 ? 'text-red-600' : 'text-slate-700'}`}>
                    {row.BMI}
                  </td>
                  <td className="p-3 font-mono text-slate-700 font-medium">{row.Age}</td>
                  <td className="p-3 font-mono text-slate-500 font-medium">{row.Insulin}</td>
                  <td className="p-3 font-mono text-slate-500 font-medium">{row.BloodPressure}</td>
                  <td className="p-3 font-mono text-slate-500 font-medium">{row.DiabetesPedigreeFunction}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-700 font-bold">
                      {row.flags_count} flags
                    </span>
                  </td>
                  <td className="p-3 font-mono font-black text-slate-900 text-sm">
                    {(row.probability * 100).toFixed(1)}%
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      row.risk_level === 'high'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : row.risk_level === 'moderate'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {row.risk_level.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
