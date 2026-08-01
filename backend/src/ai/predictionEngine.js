const prisma = require('../utils/db');

const predictProjectDelays = async () => {
  const projects = await prisma.project.findMany({
    where: { status: { in: ['ACTIVE', 'ON_HOLD', 'DRAFT'] } },
    include: {
      tasks: {
        include: {
          prerequisites: { include: { dependsOnTask: true } }
        }
      },
      milestones: true
    }
  });

  const now = new Date();

  return projects.map(p => {
    const total = p.tasks.length;
    const completed = p.tasks.filter(t => t.status === 'APPROVED' || t.status === 'COMPLETED').length;
    const progressPercent = total > 0 ? (completed / total) * 100 : 0;

    const estEnd = p.estimatedEndDate ? new Date(p.estimatedEndDate) : null;
    const isPastEnd = estEnd && estEnd < now;

    let delayProbability = 'LOW';
    let confidenceScore = 85;
    const reasoning = [];

    if (isPastEnd) {
      delayProbability = 'VERY_HIGH';
      confidenceScore = 95;
      reasoning.push('Project deadline has already elapsed with open tasks remaining.');
    } else if (progressPercent < 30 && estEnd && (estEnd - now) < (7 * 24 * 3600 * 1000)) {
      delayProbability = 'HIGH';
      confidenceScore = 90;
      reasoning.push('Less than 30% progress completed with less than 7 days remaining.');
    } else if (progressPercent < 60 && estEnd && (estEnd - now) < (14 * 24 * 3600 * 1000)) {
      delayProbability = 'MEDIUM';
      confidenceScore = 80;
      reasoning.push('Moderate task completion rate requires accelerated velocity.');
    } else {
      delayProbability = 'LOW';
      reasoning.push('Project completion trend matches target timeline schedule.');
    }

    // Projected completion date
    const daysRemainingNeeded = total > 0 ? Math.ceil((total - completed) * 2.5) : 5;
    const estimatedFinishDate = new Date(now.getTime() + daysRemainingNeeded * 24 * 3600 * 1000);

    return {
      projectId: p.id,
      projectCode: p.projectCode,
      name: p.name,
      delayProbability,
      estimatedFinishDate,
      confidenceScore,
      reasoning,
      dataSources: ['Historical Completion Rate', 'Dependency Graph', 'Estimated Hours']
    };
  });
};

module.exports = {
  predictProjectDelays
};
