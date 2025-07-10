/**
 * Path constants for Multiagent Task Manager application
 * Inspired by claude-task-master's structured approach to directory management
 */

// Main task manager directory structure
const TASKMANAGER_DIR = "tasks-data";
const TASKMANAGER_AGENTS_DIR = "tasks-data/agents";
const TASKMANAGER_REPORTS_DIR = "tasks-data/reports";
const TASKMANAGER_TEMPLATES_DIR = "tasks-data/templates";
const TASKMANAGER_BACKUPS_DIR = "tasks-data/backups";

// Task Manager configuration files
const TASKMANAGER_CONFIG_FILE = "tasks-data/config.json";
const TASKMANAGER_TRACKER_FILE = "tasks-data/task-tracker.json";
const TASKMANAGER_AGENTS_FILE = "tasks-data/agents.json";
const TASKMANAGER_STATE_FILE = "tasks-data/state.json";

// Legacy file paths (for backward compatibility)
const LEGACY_TRACKER_FILE = "task-tracker.json";
const LEGACY_AGENTS_FILE = "agents.json";

// Report files
const WORKLOAD_REPORT_FILE = "tasks-data/reports/workload-report.json";
const PROJECT_STATUS_REPORT_FILE = "tasks-data/reports/project-status.json";
const RECOMMENDATIONS_REPORT_FILE = "tasks-data/reports/recommendations.json";

// Template files
const EXAMPLE_TASK_FILE = "tasks-data/templates/example-task.json";
const AGENT_TEMPLATE_FILE = "tasks-data/templates/agent-template.json";

// General project files
const ENV_FILE = ".env";
const ENV_EXAMPLE_FILE = ".env.example";
const GITIGNORE_FILE = ".gitignore";
const README_FILE = "README.md";

// Backup naming patterns
const BACKUP_PREFIX = "backup_";
const BACKUP_DATE_FORMAT = "YYYY-MM-DD_HH-mm-ss";

/**
 * Project markers used to identify a task manager project root
 * These files/directories indicate that a directory is a Task Manager project
 */
const PROJECT_MARKERS = [
  TASKMANAGER_DIR, // tasks-data directory
  TASKMANAGER_TRACKER_FILE, // tasks-data/task-tracker.json
  LEGACY_TRACKER_FILE, // task-tracker.json (legacy)
  "package.json", // Node.js project
  ".git", // Git repository
  ".svn", // SVN repository
  "pyproject.toml", // Python project
  "Cargo.toml", // Rust project
  "go.mod", // Go project
  "composer.json", // PHP project
];

/**
 * Safe directory patterns - directories that are generally safe for task data
 */
const SAFE_DIRECTORY_PATTERNS = [
  /^\/Users\/[^\/]+\/[^\/].*/, // macOS user directories (not root level)
  /^\/home\/[^\/]+\/[^\/].*/, // Linux user directories (not root level)
  /^C:\\Users\\[^\\]+\\[^\\].*/, // Windows user directories (not root level)
  /^\.\/[^\/].*/, // Relative paths starting with ./
  /^\.\.\/[^\/].*/, // Relative paths starting with ../
];

/**
 * Unsafe directory patterns - directories that should be avoided for task data
 */
const UNSAFE_DIRECTORY_PATTERNS = [
  /^\/$/, // Root directory
  /^\/usr\//, // System directories
  /^\/opt\//, // Optional software
  /^\/var\//, // Variable data
  /^\/tmp\//, // Temporary files
  /^\/etc\//, // System configuration
  /^\/bin\//, // System binaries
  /^\/sbin\//, // System admin binaries
  /^\/root\//, // Root user home
  /^\/boot\//, // Boot files
  /^\/dev\//, // Device files
  /^\/proc\//, // Process files
  /^\/sys\//, // System files
  /node_modules/, // Node.js dependencies
  /\.npm/, // NPM cache
  /\.cache/, // Cache directories
  /\/Library\//, // macOS Library
  /\/Applications\//, // macOS Applications
  /^C:\\Windows\\/, // Windows system
  /^C:\\Program Files/, // Windows programs
  /^C:\\ProgramData/, // Windows program data
];

/**
 * Default fallback directories in order of preference
 */
const DEFAULT_FALLBACK_DIRECTORIES = [
  "~/TaskManager", // User home TaskManager
  "~/Documents/TaskManager", // User Documents TaskManager
  "~/Projects/TaskManager", // User Projects TaskManager
  "~/.taskmanager", // Hidden directory in user home
  "./tasks-data", // Relative to current directory
  "./taskmanager-data", // Alternative relative
  "./emergency-tasks-data", // Emergency fallback
];

/**
 * Environment variables used by the task manager
 */
const ENV_VARS = {
  AGENT_ID: "TASK_MANAGER_AGENT_ID",
  DATA_DIR: "TASK_MANAGER_DATA_DIR",
  USE_CURRENT_DIR: "TASK_MANAGER_USE_CURRENT_DIR",
  LOG_LEVEL: "TASK_MANAGER_LOG_LEVEL",
  DEBUG: "TASK_MANAGER_DEBUG",
  BACKUP_ENABLED: "TASK_MANAGER_BACKUP_ENABLED",
  BACKUP_INTERVAL: "TASK_MANAGER_BACKUP_INTERVAL",
};

/**
 * File extensions and patterns
 */
const FILE_EXTENSIONS = {
  JSON: ".json",
  TEXT: ".txt",
  MARKDOWN: ".md",
  LOG: ".log",
  BACKUP: ".backup",
};

/**
 * Directory permissions and access patterns
 */
const DIRECTORY_PERMISSIONS = {
  READ_WRITE: 0o755,
  READ_ONLY: 0o644,
  PRIVATE: 0o700,
};

/**
 * Default configuration values
 */
const DEFAULTS = {
  DATA_DIR: TASKMANAGER_DIR,
  MAX_RECOMMENDATIONS: 3,
  AUTO_SAVE: true,
  BACKUP_COUNT: 5,
  LOG_LEVEL: "info",
};

// CommonJS exports
module.exports = {
  TASKMANAGER_DIR,
  TASKMANAGER_AGENTS_DIR,
  TASKMANAGER_REPORTS_DIR,
  TASKMANAGER_TEMPLATES_DIR,
  TASKMANAGER_BACKUPS_DIR,
  TASKMANAGER_CONFIG_FILE,
  TASKMANAGER_TRACKER_FILE,
  TASKMANAGER_AGENTS_FILE,
  TASKMANAGER_STATE_FILE,
  LEGACY_TRACKER_FILE,
  LEGACY_AGENTS_FILE,
  WORKLOAD_REPORT_FILE,
  PROJECT_STATUS_REPORT_FILE,
  RECOMMENDATIONS_REPORT_FILE,
  EXAMPLE_TASK_FILE,
  AGENT_TEMPLATE_FILE,
  ENV_FILE,
  ENV_EXAMPLE_FILE,
  GITIGNORE_FILE,
  README_FILE,
  BACKUP_PREFIX,
  BACKUP_DATE_FORMAT,
  PROJECT_MARKERS,
  SAFE_DIRECTORY_PATTERNS,
  UNSAFE_DIRECTORY_PATTERNS,
  DEFAULT_FALLBACK_DIRECTORIES,
  ENV_VARS,
  FILE_EXTENSIONS,
  DIRECTORY_PERMISSIONS,
  DEFAULTS,
};
