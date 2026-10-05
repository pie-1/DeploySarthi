import { motion } from 'framer-motion';
import { User, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

const ChatMessage = ({ message, onFollowUp }) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <User size={14} className="text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 mb-1">You</p>
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl rounded-tl-sm px-4 py-3">
            <p className="text-sm text-gray-900 leading-relaxed">{message.content}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // AI message
  const analysis = message.analysis || {};
  const confidence = analysis.confidence || 'medium';

  const confidenceStyles = {
    high: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700' },
    low: { bg: 'bg-red-50', text: 'text-red-700' },
  };
  const conf = confidenceStyles[confidence] || confidenceStyles.medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3"
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
        <Sparkles size={14} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 mb-1">DeploySarthi AI</p>
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4 space-y-3">
          {/* Summary */}
          {analysis.summary && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">
                Summary
              </p>
              <p className="text-sm text-gray-900 leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {/* Evidence */}
          {analysis.evidence && analysis.evidence.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2">
                Evidence
              </p>
              <ul className="space-y-1">
                {analysis.evidence.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 size={12} className="text-emerald-600 flex-shrink-0 mt-1" />
                    <span className="leading-relaxed">{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Likely cause */}
          {analysis.likelyCause && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">
                Likely Cause
              </p>
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                <AlertCircle size={12} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-800 leading-relaxed">{analysis.likelyCause}</p>
              </div>
            </div>
          )}

          {/* Confidence */}
          {analysis.confidence && (
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${conf.bg}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${conf.text}`}>
                Confidence: {analysis.confidence}
              </span>
            </div>
          )}

          {/* Recommended next */}
          {analysis.recommendedNext && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">
                Recommended Next
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {analysis.recommendedNext}
              </p>
            </div>
          )}
        </div>

        {/* Follow-up questions */}
        {analysis.suggestedQuestions && analysis.suggestedQuestions.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2">
              Investigate Next
            </p>
            <div className="space-y-1.5">
              {analysis.suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onFollowUp(q)}
                  className="w-full text-left text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100
                    border border-indigo-100 rounded-lg px-3 py-2 transition-colors
                    flex items-center justify-between gap-2 group"
                >
                  <span>{q}</span>
                  <ArrowRight size={12} className="text-indigo-400 group-hover:text-indigo-600 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;