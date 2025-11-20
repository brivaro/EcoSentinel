export const formatTime = (timestamp: number): string => {
  if (!timestamp) return "--:--";
  // Shelly sends unix timestamp in seconds (sometimes float)
  return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const formatLastSeen = (timestamp: number): string => {
  if (!timestamp) return "Never";
  const diff = Date.now() - timestamp * 1000;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  return `${minutes} min ago`;
};