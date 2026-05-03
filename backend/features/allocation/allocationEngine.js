// ─────────────────────────────────────────────
// Allocation Engine
// Pure logic — no DB calls, no HTTP
// Input: project + list of freelancers
// Output: best freelancer + schedule OR suggestion
// ─────────────────────────────────────────────

// Step 1 — Filter by skill match
const filterBySkill = (freelancers, requiredSkill) => {
  return freelancers.filter((f) =>
    f.skills.some(
      (skill) => skill.toLowerCase() === requiredSkill.toLowerCase()
    )
  );
};

// Step 2 — Check deadline feasibility
// Can this freelancer finish estimatedHours before the deadline?
const isFeasible = (freelancer, estimatedHours, deadline) => {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const daysUntilDeadline = Math.ceil(
    (deadlineDate - today) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDeadline <= 0) return false;

  const availableHoursPerDay =
    freelancer.dailyCapacity - freelancer.currentLoad;

  if (availableHoursPerDay <= 0) return false;

  const daysRequired = Math.ceil(estimatedHours / availableHoursPerDay);

  return daysRequired <= daysUntilDeadline;
};

// Step 3 — Score each freelancer
// Lower workload = higher score
// More remaining hours = higher score
const scoreFreelancer = (freelancer) => {
  const remainingHours = freelancer.dailyCapacity - freelancer.currentLoad;
  const workloadRatio = freelancer.currentLoad / freelancer.dailyCapacity;
  // Score: more remaining hours is better, less workload ratio is better
  return remainingHours - workloadRatio * 10;
};

// Step 4 — Build day-by-day schedule
const buildSchedule = (freelancer, estimatedHours) => {
  const schedule = [];
  let hoursRemaining = estimatedHours;
  const today = new Date();
  let dayOffset = 1;

  const availableHoursPerDay =
    freelancer.dailyCapacity - freelancer.currentLoad;

  while (hoursRemaining > 0) {
    const hoursToday = Math.min(availableHoursPerDay, hoursRemaining);
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);

    schedule.push({ date, hours: hoursToday });

    hoursRemaining -= hoursToday;
    dayOffset++;
  }

  const estimatedCompletionDate = schedule[schedule.length - 1]?.date;

  return { schedule, estimatedCompletionDate };
};

// ─────────────────────────────────────────────
// MAIN ENGINE FUNCTION
// ─────────────────────────────────────────────
const runAllocationEngine = (project, freelancers) => {
  const { requiredSkill, estimatedHours, deadline, priority } = project;

  // Step 1: Skill filter
  let matched = filterBySkill(freelancers, requiredSkill);

  if (matched.length === 0) {
    return {
      success: false,
      reason: "NO_SKILL_MATCH",
      message: `No freelancers found with skill: ${requiredSkill}`,
      suggestions: [
        "Try a broader skill name",
        "Wait for a freelancer with this skill to register",
      ],
    };
  }

  // Step 2: Availability + feasibility filter
  let feasible = matched.filter((f) =>
    isFeasible(f, estimatedHours, deadline)
  );

  if (feasible.length === 0) {
    // Smart suggestion: find who could do it with extended deadline
    const anyAvailable = matched.filter(
      (f) => f.dailyCapacity - f.currentLoad > 0
    );

    if (anyAvailable.length === 0) {
      return {
        success: false,
        reason: "ALL_OVERLOADED",
        message: "All matching freelancers are currently at full capacity",
        suggestions: [
          "Try again later when freelancers free up",
          "Consider splitting the project into smaller tasks",
        ],
      };
    }

    // Calculate minimum deadline needed for best available freelancer
    const best = anyAvailable.sort((a, b) => scoreFreelancer(b) - scoreFreelancer(a))[0];
    const availablePerDay = best.dailyCapacity - best.currentLoad;
    const daysNeeded = Math.ceil(estimatedHours / availablePerDay);
    const suggestedDeadline = new Date();
    suggestedDeadline.setDate(suggestedDeadline.getDate() + daysNeeded + 1);

    return {
      success: false,
      reason: "DEADLINE_NOT_FEASIBLE",
      message: "No freelancer can meet the current deadline",
      suggestions: [
        `Extend deadline to at least ${suggestedDeadline.toDateString()}`,
        "Split the project across 2 freelancers to finish faster",
        "Reduce estimated hours if scope can be trimmed",
      ],
    };
  }

  // Step 3: Priority boost — urgent projects prefer least loaded freelancer
  if (priority === "urgent") {
    feasible.sort((a, b) => a.currentLoad - b.currentLoad);
  } else {
    // Normal: sort by score
    feasible.sort((a, b) => scoreFreelancer(b) - scoreFreelancer(a));
  }

  // Step 4: Pick best freelancer
  const chosen = feasible[0];

  // Step 5: Build schedule
  const { schedule, estimatedCompletionDate } = buildSchedule(
    chosen,
    estimatedHours
  );

  return {
    success: true,
    freelancer: chosen,
    assignedHours: estimatedHours,
    schedule,
    estimatedCompletionDate,
  };
};

export default runAllocationEngine;