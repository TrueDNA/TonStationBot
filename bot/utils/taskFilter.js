var _ = require("lodash");
function taskFilter(tasks, query_name) {
  if (_.isEmpty(tasks)) return [];
  return tasks.filter((task) => {
    if (typeof query_name == "string") {
      return task.category.toLowerCase() === query_name.toLowerCase();
    } else if (Array.isArray(query_name)) {
      return query_name.includes(task.category.toLowerCase());
    } else {
      return [];
    }
  });
}

module.exports = taskFilter;
