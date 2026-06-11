import { useState } from "react";

const StarRating = ({ onSubmit, loading }) => {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);

  const handleSubmit = () => {
    if (selected === 0) return;
    onSubmit(selected);
  };

  return (
    <div className="mt-3">
      <p className="text-xs text-slate-500 mb-2">Rate this freelancer</p>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setSelected(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-2xl transition-colors focus:outline-none"
          >
            <span
              className={
                star <= (hovered || selected)
                  ? "text-yellow-400"
                  : "text-gray-300"
              }
            >
              ★
            </span>
          </button>
        ))}
        {selected > 0 && (
          <span className="text-xs text-slate-500 ml-1">
            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][selected]}
          </span>
        )}
      </div>
      <button
        onClick={handleSubmit}
        disabled={selected === 0 || loading}
        className="w-full bg-yellow-500 text-white text-sm py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-40 transition-colors"
      >
        {loading ? "Submitting..." : "Submit Rating"}
      </button>
    </div>
  );
};

export default StarRating;