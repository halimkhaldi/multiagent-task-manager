/**
 * Directory utilities for Multiagent Task Manager
 * Inspired by claude-task-master's robust directory handling approach
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Import constants (using require for CommonJS compatibility)
const {
    PROJECT_MARKERS,
    SAFE_DIRECTORY_PATTERNS,
    UNSAFE_DIRECTORY_PATTERNS,
    DEFAULT_FALLBACK_DIRECTORIES,
    ENV_VARS,
    TASKMANAGER_DIR,
    DEFAULTS
} = require('../constants/paths.js');

/**
 * Finds the project root by searching upward from a starting directory
 * @param {string} startDir - Directory to start searching from (defaults to process.cwd())
 * @param {string[]} markers - Project marker files/directories to look for
 * @returns {string|null} Path to project root or null if not found
 */
function findProjectRoot(startDir = process.cwd(), markers = PROJECT_MARKERS) {
    let currentPath = path.resolve(startDir);
    const rootPath = path.parse(currentPath).root;

    // Search upward until we find a marker or reach the filesystem root
    while (currentPath !== rootPath) {
        // Check if any marker exists in the current directory
        const hasMarker = markers.some(marker => {
            const markerPath = path.join(currentPath, marker);
            try {
                return fs.existsSync(markerPath);
            } catch (error) {
                // If we can't access the path, skip it
                return false;
            }
        });

        if (hasMarker) {
            return currentPath;
        }

        // Move up one directory
        currentPath = path.dirname(currentPath);
    }

    // Check the root directory as well
    const hasMarkerInRoot = markers.some(marker => {
        const markerPath = path.join(rootPath, marker);
        try {
            return fs.existsSync(markerPath);
        } catch (error) {
            return false;
        }
    });

    return hasMarkerInRoot ? rootPath : null;
}

/**
 * Checks if a directory path is safe for storing task data
 * @param {string} dirPath - Directory path to check
 * @returns {boolean} True if directory is safe, false otherwise
 */
function isDirectorySafe(dirPath) {
    if (!dirPath || typeof dirPath !== 'string') {
        return false;
    }

    // Normalize path for consistent checking
    const normalizedPath = path.resolve(dirPath);
    const lowerPath = normalizedPath.toLowerCase();

    // Check against unsafe patterns first
    for (const unsafePattern of UNSAFE_DIRECTORY_PATTERNS) {
        if (unsafePattern.test(normalizedPath) || unsafePattern.test(lowerPath)) {
            return false;
        }
    }

    // Check against safe patterns
    for (const safePattern of SAFE_DIRECTORY_PATTERNS) {
        if (safePattern.test(normalizedPath)) {
            return true;
        }
    }

    // Additional safety checks

    // Path length validation
    if (normalizedPath.length < 2) {
        return false;
    }

    // Check if it's a user directory (additional safety for paths not caught by patterns)
    if (normalizedPath.startsWith('/Users/') || normalizedPath.startsWith('/home/')) {
        // Additional checks for problematic subdirectories in user paths
        const problematicSubdirs = [
            'node_modules', '.npm', '.cache', 'Library', 'Applications',
            '.Trash', '.local/share/Trash', 'AppData'
        ];

        return !problematicSubdirs.some(subdir => normalizedPath.includes(subdir));
    }

    // For relative paths, they're generally safe if they don't contain problematic patterns
    if (!path.isAbsolute(normalizedPath)) {
        return true;
    }

    // Default to false for unrecognized absolute paths
    return false;
}

/**
 * Expands tilde (~) in path to user home directory
 * @param {string} dirPath - Path that may contain tilde
 * @returns {string} Expanded path
 */
function expandTildePath(dirPath) {
    if (!dirPath || typeof dirPath !== 'string') {
        return dirPath;
    }

    if (dirPath.startsWith('~/')) {
        const homeDir = os.homedir();
        return path.join(homeDir, dirPath.slice(2));
    }

    return dirPath;
}

/**
 * Finds the best safe directory for task data storage
 * @param {string} preferredDir - Preferred directory (optional)
 * @param {string} projectRoot - Project root directory (optional)
 * @returns {string} Best available safe directory
 */
function findSafeDirectory(preferredDir = null, projectRoot = null) {
    const candidates = [];

    // Add preferred directory if provided and safe
    if (preferredDir) {
        const expandedPreferred = expandTildePath(preferredDir);
        if (isDirectorySafe(expandedPreferred)) {
            candidates.push(expandedPreferred);
        }
    }

    // Add environment variable directory if set and safe
    const envDataDir = process.env[ENV_VARS.DATA_DIR];
    if (envDataDir) {
        const expandedEnvDir = expandTildePath(envDataDir);
        if (isDirectorySafe(expandedEnvDir)) {
            candidates.push(expandedEnvDir);
        }
    }

    // Add project root based directory if project root is available and safe
    if (projectRoot && isDirectorySafe(projectRoot)) {
        candidates.push(path.join(projectRoot, TASKMANAGER_DIR));
    }

    // Add default fallback directories (expand tilde paths)
    for (const fallbackDir of DEFAULT_FALLBACK_DIRECTORIES) {
        const expandedDir = expandTildePath(fallbackDir);
        if (isDirectorySafe(expandedDir)) {
            candidates.push(expandedDir);
        }
    }

    // Add current directory if safe
    try {
        const cwd = process.cwd();
        if (isDirectorySafe(cwd)) {
            candidates.push(path.join(cwd, TASKMANAGER_DIR));
        }
    } catch (error) {
        // If we can't get current directory, skip it
    }

    // Return first safe candidate
    for (const candidate of candidates) {
        if (candidate && isDirectorySafe(candidate)) {
            return candidate;
        }
    }

    // Ultra fallback - relative directory
    return './emergency-tasks-data';
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dirPath - Directory path to ensure exists
 * @returns {boolean} True if directory exists or was created successfully
 */
function ensureDirectoryExists(dirPath) {
    if (!dirPath) {
        return false;
    }

    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Validates that a directory is writable
 * @param {string} dirPath - Directory path to check
 * @returns {boolean} True if directory is writable
 */
function isDirectoryWritable(dirPath) {
    if (!dirPath || !fs.existsSync(dirPath)) {
        return false;
    }

    try {
        // Try to create a temporary file to test write access
        const testFile = path.join(dirPath, `.write-test-${Date.now()}`);
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Gets directory information and safety status
 * @param {string} dirPath - Directory path to analyze
 * @returns {Object} Directory information object
 */
function getDirectoryInfo(dirPath) {
    const info = {
        path: dirPath,
        resolved: null,
        exists: false,
        safe: false,
        writable: false,
        error: null
    };

    try {
        info.resolved = path.resolve(dirPath);
        info.exists = fs.existsSync(info.resolved);
        info.safe = isDirectorySafe(info.resolved);

        if (info.exists) {
            info.writable = isDirectoryWritable(info.resolved);
        }
    } catch (error) {
        info.error = error.message;
    }

    return info;
}

/**
 * Resolves the best directory for task manager data
 * @param {Object} options - Configuration options
 * @param {string} options.dataDir - Preferred data directory
 * @param {boolean} options.useCurrentDir - Whether to prefer current directory
 * @param {string} options.projectRoot - Project root directory
 * @returns {Object} Resolved directory information
 */
function resolveTaskManagerDirectory(options = {}) {
    const { dataDir, useCurrentDir, projectRoot } = options;

    let resolvedDir;
    let strategy = 'unknown';
    let fallbackUsed = false;

    // Strategy 1: Use provided data directory
    if (dataDir) {
        const dirInfo = getDirectoryInfo(dataDir);
        if (dirInfo.safe) {
            resolvedDir = dataDir;
            strategy = 'provided-datadir';
        } else {
            fallbackUsed = true;
        }
    }

    // Strategy 2: Use project root if safe and no data dir provided
    if (!resolvedDir && projectRoot && !dataDir) {
        const projectDataDir = path.join(projectRoot, TASKMANAGER_DIR);
        const dirInfo = getDirectoryInfo(projectDataDir);
        if (dirInfo.safe) {
            resolvedDir = projectDataDir;
            strategy = 'project-root';
        }
    }

    // Strategy 3: Use current directory if explicitly requested and safe
    if (!resolvedDir && useCurrentDir) {
        try {
            const cwd = process.cwd();
            const cwdDataDir = path.join(cwd, TASKMANAGER_DIR);
            const dirInfo = getDirectoryInfo(cwdDataDir);
            if (dirInfo.safe) {
                resolvedDir = cwdDataDir;
                strategy = 'current-dir';
            } else {
                fallbackUsed = true;
            }
        } catch (error) {
            fallbackUsed = true;
        }
    }

    // Strategy 4: Use intelligent fallback
    if (!resolvedDir) {
        resolvedDir = findSafeDirectory(dataDir, projectRoot);
        strategy = 'intelligent-fallback';
        fallbackUsed = true;
    }

    const finalInfo = getDirectoryInfo(resolvedDir);

    return {
        directory: resolvedDir,
        strategy,
        fallbackUsed,
        safe: finalInfo.safe,
        exists: finalInfo.exists,
        writable: finalInfo.writable,
        error: finalInfo.error,
        info: finalInfo
    };
}

/**
 * Creates the complete task manager directory structure
 * @param {string} baseDir - Base directory to create structure in
 * @returns {Object} Result of directory creation
 */
function createTaskManagerStructure(baseDir) {
    const result = {
        success: false,
        created: [],
        errors: [],
        baseDir
    };

    const directories = [
        baseDir,
        path.join(baseDir, 'agents'),
        path.join(baseDir, 'reports'),
        path.join(baseDir, 'templates'),
        path.join(baseDir, 'backups')
    ];

    for (const dir of directories) {
        try {
            if (ensureDirectoryExists(dir)) {
                result.created.push(dir);
            }
        } catch (error) {
            result.errors.push({ directory: dir, error: error.message });
        }
    }

    result.success = result.errors.length === 0 && result.created.length > 0;
    return result;
}

/**
 * Migrates data from legacy locations to new structure
 * @param {string} projectRoot - Project root directory
 * @param {string} newDataDir - New data directory location
 * @returns {Object} Migration result
 */
function migrateLegacyData(projectRoot, newDataDir) {
    const result = {
        success: false,
        migrated: [],
        errors: [],
        skipped: []
    };

    const legacyMappings = [
        { from: 'task-tracker.json', to: 'task-tracker.json' },
        { from: 'agents.json', to: 'agents.json' }
    ];

    for (const mapping of legacyMappings) {
        const legacyPath = path.join(projectRoot, mapping.from);
        const newPath = path.join(newDataDir, mapping.to);

        try {
            if (fs.existsSync(legacyPath) && !fs.existsSync(newPath)) {
                // Copy legacy file to new location
                fs.copyFileSync(legacyPath, newPath);
                result.migrated.push({ from: legacyPath, to: newPath });
            } else if (fs.existsSync(newPath)) {
                result.skipped.push({ file: mapping.to, reason: 'already exists in new location' });
            } else {
                result.skipped.push({ file: mapping.from, reason: 'legacy file not found' });
            }
        } catch (error) {
            result.errors.push({
                file: mapping.from,
                error: error.message
            });
        }
    }

    result.success = result.errors.length === 0;
    return result;
}

module.exports = {
    findProjectRoot,
    isDirectorySafe,
    expandTildePath,
    findSafeDirectory,
    ensureDirectoryExists,
    isDirectoryWritable,
    getDirectoryInfo,
    resolveTaskManagerDirectory,
    createTaskManagerStructure,
    migrateLegacyData
};
