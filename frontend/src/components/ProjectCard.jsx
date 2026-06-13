const statusStyles = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  assigned: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-purple-50 text-purple-700 border-purple-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const priorityStyles = {
  urgent: "bg-red-100 text-red-700",
  normal: "bg-slate-100 text-slate-600",
};

const ProjectCard = ({
  project,
  onAssign,
  assignment,
  onReassign,
  onEdit,
  isAdmin,
  isAllocating,
  ratingComponent,
}) => {
  const deadline = new Date(project.deadline);
  const today = new Date();
  const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">

      {/* Title row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-medium text-slate-800 text-base">{project.title}</h3>
          <p className="text-sm text-slate-400 mt-0.5">{project.requiredSkill}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0 items-center">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityStyles[project.priority]}`}>
            {project.priority}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${statusStyles[project.status]}`}>
            {project.status.replace("_", " ")}
          </span>
          {/* Edit button — only for pending projects, only for client view */}
          {project.status === "pending" && onEdit && (
            <button
              onClick={() => onEdit(project)}
              className="text-slate-400 hover:text-slate-700 transition-colors ml-1"
              title="Edit project"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <p className="text-xs text-slate-400">Estimated</p>
          <p className="text-sm font-medium text-slate-700">{project.estimatedHours}h</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Deadline</p>
          <p className="text-sm font-medium text-slate-700">
            {deadline.toLocaleDateString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Days left</p>
          <p className={`text-sm font-medium ${daysLeft <= 2 ? "text-red-600" : "text-slate-700"}`}>
            {daysLeft > 0 ? `${daysLeft}d` : "Overdue"}
          </p>
        </div>
      </div>

      {/* Assignment info */}
      {assignment && (
        <div className="bg-slate-50 rounded-lg px-3 py-2 mb-3 text-sm">
          <span className="text-slate-500">Assigned to </span>
          <span className="font-medium text-slate-700">
            {assignment.freelancerId?.userId?.name || "Freelancer"}
          </span>
          {assignment.estimatedCompletionDate && (
            <span className="text-slate-500">
              {" · "}Est.{" "}
              {new Date(assignment.estimatedCompletionDate).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {project.status === "pending" && onAssign && (
          <button
            onClick={() => onAssign(project._id)}
            disabled={isAllocating}
            className="flex-1 bg-slate-800 text-white text-sm py-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {isAllocating ? "Allocating..." : "Run Allocation"}
          </button>
        )}
        {isAdmin && assignment && assignment.status === "active" && onReassign && (
          <button
            onClick={() => onReassign(assignment._id)}
            className="flex-1 border border-slate-300 text-slate-600 text-sm py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Reassign
          </button>
        )}
      </div>

      {/* Rating UI injected from parent */}
      {ratingComponent && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {ratingComponent}
        </div>
      )}
    </div>
  );
};

export default ProjectCard;