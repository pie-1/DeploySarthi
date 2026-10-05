import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

const ChatInput = ({ onSend, loading, disabled }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || loading || disabled) return;
    onSend(value.trim());
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        placeholder={disabled ? 'Create an incident to start investigating' : 'Ask DeploySarthi...'}
        disabled={disabled || loading}
        rows={1}
        className="w-full px-4 py-3 pr-12 text-sm bg-white border border-gray-200 rounded-xl
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400
          resize-none"
      />
      <button
        type="submit"
        disabled={!value.trim() || loading || disabled}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg
          bg-indigo-600 text-white hover:bg-indigo-700 transition-colors
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
      </button>
    </form>
  );
};

export default ChatInput;