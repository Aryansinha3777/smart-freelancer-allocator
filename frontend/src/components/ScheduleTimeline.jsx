const ScheduleTimeline = ({ schedule, estimatedCompletionDate }) => {
  if (!schedule || schedule.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-slate-700 mb-3">Work Schedule</h4>
      <div className="space-y-2">
        {schedule.map((block, index) => {
          const date = new Date(block.date);
          const isLast = index === schedule.length - 1;

          return (
            <div key={index} className="flex items-start gap-3">
              <div className="flex flex-col items-center mt-1">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isLast ? "bg-green-500" : "bg-slate-300"}`} />
                {!isLast && <div className="w-px h-5 bg-slate-200 mt-1" />}
              </div>
              <div className="flex justify-between w-full pb-1">
                <span className="text-sm text-slate-600">
                  {date.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-sm font-medium text-slate-800">
                  {block.hours}h
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {estimatedCompletionDate && (
        <p className="text-xs text-green-600 font-medium mt-3">
          ✓ Expected completion:{" "}
          {new Date(estimatedCompletionDate).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}
    </div>
  );
};

export default ScheduleTimeline;