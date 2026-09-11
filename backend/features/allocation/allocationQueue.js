import Bull from "bull";

const allocationQueue = new Bull("allocation", {
  redis: process.env.REDIS_URL
    ? process.env.REDIS_URL
    : {
        host: "127.0.0.1",
        port: 6379,
      },
});

allocationQueue.on("error", (err) => {
  console.error("Queue error:", err.message);
});

export default allocationQueue;