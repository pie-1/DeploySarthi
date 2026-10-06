export const CATEGORIES = [
  { value: 'all', label: 'All', emoji: '🌐' },
  { value: 'web_app', label: 'Web Apps', emoji: '💻' },
  { value: 'api', label: 'APIs', emoji: '🔌' },
  { value: 'mobile', label: 'Mobile', emoji: '📱' },
  { value: 'ai_ml', label: 'AI / ML', emoji: '🤖' },
  { value: 'devops', label: 'DevOps', emoji: '⚙️' },
  { value: 'healthcare', label: 'Healthcare', emoji: '🏥' },
  { value: 'environment', label: 'Environment', emoji: '🌱' },
  { value: 'education', label: 'Education', emoji: '📚' },
  { value: 'startup', label: 'Startups', emoji: '🚀' },
  { value: 'ecommerce', label: 'E-commerce', emoji: '🛒' },
  { value: 'other', label: 'Other', emoji: '📦' },
];

export const getCategoryLabel = (value) => {
  const cat = CATEGORIES.find((c) => c.value === value);
  return cat ? cat.label : 'Other';
};

export const getCategoryEmoji = (value) => {
  const cat = CATEGORIES.find((c) => c.value === value);
  return cat ? cat.emoji : '📦';
};