const Task = require('../models/Task');
const { getNextOccurrence } = require('../utils/recurrenceEngine');
const { startOfDay } = require('date-fns');

async function processRecurringTasks() {
  try {
    const today = startOfDay(new Date());
    const templates = await Task.find({
      isRecurringTemplate: true,
      recurrenceActive: true,
      nextOccurrenceDate: { $lte: today }
    });

    console.log(`[RECURRING JOB] Found ${templates.length} templates to process`);

    for (const template of templates) {
      let currentOccurrenceDate = new Date(template.nextOccurrenceDate);

      while (currentOccurrenceDate <= today) {
        const occurrence = new Task({
          title: template.title,
          description: template.description,
          project: template.project,
          boardId: template.boardId,
          status: 'Todo',
          priority: template.priority,
          context: template.context,
          tags: template.tags,
          assignedTo: template.assignedTo,
          parentRecurringTask: template._id,
          occurrenceDate: currentOccurrenceDate,
          dueDate: currentOccurrenceDate,
          isRecurringTemplate: false,
          isRecurring: false
        });
        await occurrence.save();
        console.log(`[RECURRING JOB] Generated occurrence for template "${template.title}" on date ${currentOccurrenceDate.toDateString()}`);

        try {
          const { emitToProject } = require('../utils/socketEmitter');
          emitToProject(template.project.toString(), 'TASK_CREATED', {
            task: occurrence,
            projectId: template.project.toString()
          });
        } catch (wsErr) {
          console.error('[RECURRING JOB] WS emission failed:', wsErr);
        }

        const nextDate = getNextOccurrence(template.recurrenceRule, currentOccurrenceDate);
        if (!nextDate) {
          template.nextOccurrenceDate = null;
          template.recurrenceActive = false;
          break;
        } else {
          currentOccurrenceDate = nextDate;
        }
      }

      if (template.recurrenceActive) {
        template.nextOccurrenceDate = currentOccurrenceDate;
      }
      await template.save();
    }
  } catch (err) {
    console.error('[RECURRING JOB] Error running recurring task job:', err);
  }
}

function startRecurringJob() {
  setTimeout(processRecurringTasks, 5000);
  setInterval(processRecurringTasks, 60 * 60 * 1000);
}

module.exports = {
  processRecurringTasks,
  startRecurringJob
};
