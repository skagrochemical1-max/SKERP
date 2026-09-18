const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'Stable':
        return 'bg-cyber-emerald/20 text-cyber-emerald border-cyber-emerald';
      case 'Testing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'Archived':
        return 'bg-cyber-gray/20 text-cyber-light border-cyber-gray';
      default:
        return 'bg-cyber-gray/20 text-cyber-light border-cyber-gray';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-mono border rounded ${getStatusStyles()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
