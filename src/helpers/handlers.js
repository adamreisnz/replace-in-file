import chalk from 'chalk'

/**
 * Success handler
 */
export function successHandler(results, verbose) {
  const changed = results.filter(result => result.hasChanged)
  const numChanges = changed.length
  if (numChanges > 0) {
    console.log(chalk.green(`${numChanges} file(s) were changed`))
    if (verbose) {
      changed.forEach(result => console.log(chalk.grey('-', result.file)))
    }
  }
  else {
    console.log(chalk.yellow('No files were changed'))
  }
}

/**
 * Error handler
 */
export function errorHandler(error, exitCode = 1) {
  console.error(error)
  process.exit(exitCode)
}

/**
 * Helper to log a dry run
 */
export function logDryRun(log) {
  if (log) {
    console.log(chalk.yellow('Dry run, not making actual changes'))
  }
}
