export default function LoadingScreen({ isLoading }) {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
      <div className="text-center">
        <div className="text-6xl mb-4">🌍</div>
        <h2 className="text-3xl font-bold text-white mb-2">Loading World...</h2>
        <div className="flex gap-2 justify-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
