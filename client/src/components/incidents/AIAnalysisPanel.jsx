import { useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Brain } from 'lucide-react';

const AIAnalysisPanel = ({ analysis }) => {
  const [expanded, setExpanded] = useState(true);

  if (!analysis || !analysis.summary) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">AI Analysis</h3>
        </div>
        <p className="text-sm text-gray-500">
          AI investigation not available for this incident yet.
        </p>
      </div>
    );
  }

  const confidenceStyles = {
    high: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    low: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  };

  const conf = confidenceStyles[analysis.confidence] || confidenceStyles.medium;

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50
      border border-indigo-100 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Brain size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">AI Investigation</h3>
            <p className="text-xs text-gray-500">Powered by Groq · Llama 3</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg hover:bg-white/60 transition-colors"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="p-5 space-y-5">
          {/* Summary */}
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
              Summary
            </p>
            <p className="text-sm text-gray-800 leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Likely Cause */}
          {analysis.likelyCause && (
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                Likely Cause
              </p>
              <div className="flex items-start gap-2 bg-white border border-gray-100 rounded-lg p-3">
                <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-800 leading-relaxed">{analysis.likelyCause}</p>
              </div>
            </div>
          )}

          {/* Evidence */}
          {analysis.evidence?.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                Evidence
              </p>
              <ul className="space-y-1.5">
                {analysis.evidence.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600
                      flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Investigation */}
          {analysis.suggestedInvestigation && (
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                Suggested Investigation
              </p>
              <div className="flex items-start gap-2 bg-white border border-gray-100 rounded-lg p-3">
                <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-800 leading-relaxed">
                  {analysis.suggestedInvestigation}
                </p>
              </div>
            </div>
          )}

          {/* Confidence */}
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${conf.bg} ${conf.border}`}>
            <Sparkles size={14} className={conf.text} />
            <div>
              <p className={`text-xs font-bold ${conf.text} uppercase tracking-wide`}>
                Confidence: {analysis.confidence || 'medium'}
              </p>
              {analysis.confidenceReason && (
                <p className="text-xs text-gray-600 mt-0.5">{analysis.confidenceReason}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisPanel;
