
export default function MyMessagesPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-ink-50">
        <svg className="h-5 w-5 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.06 0-2.076-.163-3.016-.463L3 21l1.5-4.5C3.55 15.163 3 13.63 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-ink-600">Select a conversation</p>
      <p className="mt-1 text-xs text-ink-400">Pick a thread on the left to view messages.</p>
    </div>
  );
}