const STATUS_CONFIG = {
  WISHLIST: {
    label: 'Wishlist',
    dot: 'bg-[#8b8fa8]',
    className: 'bg-[#2a2d3e] text-[#8b8fa8] border border-[#353849]',
  },
  READING: {
    label: 'Reading',
    dot: 'bg-indigo-400',
    className: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30',
  },
  FINISHED: {
    label: 'Finished',
    dot: 'bg-green-400',
    className: 'bg-green-500/10 text-green-300 border border-green-500/30',
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.WISHLIST;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
