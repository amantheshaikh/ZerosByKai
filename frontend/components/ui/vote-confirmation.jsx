import Link from 'next/link';

export default function VoteConfirmation({ ideaName, changed, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="pop-in comic-panel bg-white p-8 max-w-md w-full mx-4 comic-shadow text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl mb-4">🎯</div>
        <h2 className="comic-title text-3xl mb-3 text-black">
          {changed ? 'VOTE CHANGED!' : 'VOTE CAST!'}
        </h2>
        <p className="comic-body text-gray-700 mb-2">
          {changed
            ? `You switched your pick to`
            : `You voted for`}
        </p>
        <p className="comic-title text-xl text-rose-700 mb-6">{ideaName}</p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/profile"
            className="px-5 py-2 bg-yellow-400 border-2 border-black comic-title text-sm hover:bg-yellow-300 transition-colors text-black"
          >
            VIEW PROFILE
          </Link>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-black text-yellow-400 border-2 border-black comic-title text-sm hover:bg-gray-900 transition-colors"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}
