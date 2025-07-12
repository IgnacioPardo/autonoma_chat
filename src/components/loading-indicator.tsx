interface LoadingIndicatorProps {
  isLoading: boolean;
}

export default function LoadingIndicator({ isLoading }: LoadingIndicatorProps) {
  if (!isLoading) return null;

  return (
    <div className="flex justify-start mb-4">
      <div className="flex flex-col gap-2 max-w-xs lg:max-w-md items-start">
        <div className="flex items-center gap-3 bg-gray-100 text-black p-4 rounded-3xl rounded-bl-lg shadow-lg">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-200 rounded-full animate-typing-pulse"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-typing-pulse-delay-1"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-typing-pulse-delay-2"></div>
          </div>
          <span className="text-sm text-gray-600">Autonoma está escribiendo...</span>
        </div>
      </div>
    </div>
  );
}
