const STATUS_CONFIG = {
  WISHLIST: {
    label: 'Wishlist',
    className: 'bg-slate-700 text-slate-300 border border-slate-600',
  },
  READING: {
    label: 'Reading',
    className: 'bg-blue-900/40 text-blue-300 border border-blue-800/60',
  },
  FINISHED: {
    label: 'Finished',
    className: 'bg-green-900/40 text-green-300 border border-green-800/60',
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.WISHLIST;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
