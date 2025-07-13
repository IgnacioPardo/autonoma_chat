interface LoadingIndicatorProps {
  isLoading: boolean;
}

export default function LoadingIndicator({ isLoading }: LoadingIndicatorProps) {
  if (!isLoading) return null;

  return (
    <div className="animate-in fade-in mb-4 flex justify-start duration-200">
      <div className="flex max-w-xs flex-col items-start gap-2 lg:max-w-md">
        <div className="flex items-center gap-3 rounded-3xl rounded-bl-lg bg-gray-100 p-4 text-black shadow-lg transition-all duration-200">
          <div className="flex gap-1">
            <div className="animate-typing-pulse h-2 w-2 rounded-full bg-gray-200"></div>
            <div className="animate-typing-pulse-delay-1 h-2 w-2 rounded-full bg-gray-300"></div>
            <div className="animate-typing-pulse-delay-2 h-2 w-2 rounded-full bg-gray-400"></div>
          </div>
          {/* <span className="text-sm text-gray-600">Autonoma Chat está cargando...</span> */}
        </div>
      </div>
    </div>
  );
}
