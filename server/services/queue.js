// BullMQ wrapper service with a mock fallback for local environments
const jobHandlers = new Map();

const addJob = async (queueName, jobName, data) => {
  console.log(`[Queue] Added job to queue "${queueName}": ${jobName}`, data);
  // Execute asynchronously
  setTimeout(async () => {
    const handler = jobHandlers.get(queueName);
    if (handler) {
      try {
        await handler({ name: jobName, data });
      } catch (err) {
        console.error(`[Queue] Error running job ${jobName}:`, err);
      }
    }
  }, 100);
  return { id: Math.random().toString(36).substring(7) };
};

const registerWorker = (queueName, handler) => {
  jobHandlers.set(queueName, handler);
  console.log(`[Queue] Registered worker for queue "${queueName}"`);
};

module.exports = {
  addJob,
  registerWorker
};
