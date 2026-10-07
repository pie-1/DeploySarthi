import { Sparkles, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const AIAnalysisPanel = ({ analysis, incidentId }) => {
  if (!analysis || !analysis.summary) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">AI Investigation</h3>
            <p className="text-xs text-gray-500">Powered by Groq</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <Loader2 size={16} className="animate-spin text-gray-400" />
          <p className="text-sm text-gray-600">AI investigation in progress...</p>
        </div>
      </div>
    );
  }

  const confidenceStyles = {
    high: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700' },
    low: { bg: 'bg-red-50', text: 'text-red-700' },
  };
  const conf = confidenceStyles[analysis.confidence] || confidenceStyles.medium;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">AI Investigation</h3>
            <p className="text-xs text-gray-500">
              Powered by Groq
              {analysis.analysisSource === 'fallback' && (
                <span className="ml-2 text-amber-600 font-semibold">· rule-based fallback</span>
              )}
            </p>
          </div>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${conf.bg}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wide ${conf.text}`}>
            {analysis.confidence}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">
            Summary
          </p>
          <p className="text-sm text-gray-900 leading-relaxed">{analysis.summary}</p>
        </div>

        {/* Evidence */}
        {analysis.evidence?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2">
              Evidence
            </p>
            <ul className="space-y-1.5">
              {analysis.evidence.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{e}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Likely cause — hidden when N/A */}
        {analysis.likelyCause && analysis.likelyCause !== 'N/A' && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">
              Likely Cause
            </p>
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3">
              <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-800 leading-relaxed">{analysis.likelyCause}</p>
            </div>
          </div>
        )}

        {/* Recommended next — hidden when N/A */}
        {analysis.recommendedNext && analysis.recommendedNext !== 'N/A' && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">
              Recommended Next
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{analysis.recommendedNext}</p>
          </div>
        )}

        {/* Confidence reason */}
        {analysis.confidenceReason && (
          <p className="text-xs text-gray-500 italic">{analysis.confidenceReason}</p>
        )}

        {/* Suggested questions — inline chips */}
        {analysis.suggestedQuestions?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2">
              Investigate Next
            </p>
            <div className="space-y-1.5">
              {analysis.suggestedQuestions.slice(0, 3).map((q, i) => (
                <Link
                  key={i}
                  to={`/ai?incidentId=${incidentId}`}
                  className="block w-full text-left text-xs text-indigo-700 bg-indigo-50 
                    hover:bg-indigo-100 border border-indigo-100 rounded-lg px-3 py-2 
                    transition-colors flex items-center justify-between gap-2 group"
                >
                  <span>{q}</span>
                  <ArrowRight size={12} className="text-indigo-400 group-hover:text-indigo-600 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Ask DeploySarthi CTA */}
        {incidentId && (
          <div className="pt-4 border-t border-gray-100">
            <Link
              to={`/ai?incidentId=${incidentId}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold
                rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <Sparkles size={14} />
              Ask DeploySarthi for more details
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisPanel;