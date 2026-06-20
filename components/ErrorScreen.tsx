"use client";

export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-bold text-red-400">Failed to load tournament data</h1>
        <p className="text-neutral-400 text-sm">Could not fetch live data from ESPN.</p>
        <pre className="text-xs text-neutral-600 bg-neutral-900 rounded p-4 text-left overflow-auto">{message}</pre>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-neutral-400 underline hover:text-neutral-200"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
