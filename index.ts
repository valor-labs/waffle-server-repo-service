import { createLogger, Logger } from 'bunyan';
import { ChildProcess } from 'child_process';
import { defaults, includes } from 'lodash';
import * as shell from 'shelljs';

export interface Options {
  silent?: Boolean;
  gitRepo: string;
  githubUrl: string;
  pathToRepo: string;
  async?: Boolean;
  branch?: string;
  commit?: string;
}

export interface ShellOptions {
  silent?: Boolean;
  async?: Boolean;
}

export declare function pick<T, K extends keyof T>(obj: T, ...keys: K[]): Pick<T, K>;

export const defaultOptions: any = {
  silent: true,
  async: true,
  branch: 'master',
  commit: 'HEAD'
};

class ReposService {
  private _logger: Logger;

  public constructor(logger: Logger) {
    this._logger = logger;
  }

  public set logger(logger: Logger) {
    this._logger = logger;
  }

  public silentClone(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { gitRepo, githubUrl, pathToRepo, branch } = defaults(options, defaultOptions);
    const command = `git -C ${gitRepo} clone ${githubUrl} ${pathToRepo} -b ${branch}`;

    return shell.exec(command, options, (code: number, stdout: string, stderr: string) => {
      const isNotEmptyDirectory = includes(stderr, 'already exists and is not an empty directory');

      if (isNotEmptyDirectory) {
        return callback();
      }

      if (code !== 0) {
        this._logger.error({ obj: { code, command, options, stdout, stderr, defaultOptions } });

        return callback(stderr);
      }

      return callback();
    });
  }

  public clone(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { gitRepo, githubUrl, pathToRepo, branch } = defaults(options, defaultOptions);
    const command = `git -C ${gitRepo} clone ${githubUrl} ${pathToRepo} -b ${branch}`;

    return this.runShellJsCommand(command, pick(options, 'silent', 'async'), callback);
  }

  public checkoutToBranch(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { gitRepo, branch } = defaults(options, defaultOptions);
    const command = `${this.getAbsolutePathToRepo(gitRepo)} checkout ${branch}`;

    return this.runShellJsCommand(command, pick(options, 'silent', 'async'), callback);
  }

  public checkoutToCommit(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { gitRepo, commit } = defaults(options, defaultOptions);
    const command = `${this.getAbsolutePathToRepo(gitRepo)} checkout ${commit}`;

    return this.runShellJsCommand(command, pick(options, 'silent', 'async'), callback);
  }

  public fetch(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { gitRepo } = defaults(options, defaultOptions);
    const command = `${this.getAbsolutePathToRepo(gitRepo)} fetch --all --prune`;

    return this.runShellJsCommand(command, pick(options, 'silent', 'async'), callback);
  }

  public reset(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { gitRepo, branch } = defaults(options, defaultOptions);
    const command = `${this.getAbsolutePathToRepo(gitRepo)} reset --hard origin/${branch}`;

    return this.runShellJsCommand(command, pick(options, 'silent', 'async'), callback);
  }

  public pull(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { gitRepo, branch } = defaults(options, defaultOptions);
    const command = `${this.getAbsolutePathToRepo(gitRepo)} pull origin ${branch}`;

    return this.runShellJsCommand(command, pick(options, 'silent', 'async'), callback);
  }

  public clean(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { gitRepo } = defaults(options, defaultOptions);
    const command = `${this.getAbsolutePathToRepo(gitRepo)} clean -f -d`;

    return this.runShellJsCommand(command, pick(options, 'silent', 'async'), callback);
  }

  private runShellJsCommand(command: string, options: ShellOptions, callback: ErrorCallback<string>): ChildProcess {
    return shell.exec(command, options, (code: number, stdout: string, stderr: string) => {
      if (code !== 0) {
        this._logger.error({ obj: { code, command, options, stdout, stderr, defaultOptions } });

        return callback(stderr);
      }

      return callback();
    });
  }

  private getAbsolutePathToRepo(gitRepo: string): string {
    return `git --git-dir=${gitRepo}/.git --work-tree=${gitRepo}`;
  }
}

const defaultLogger = createLogger({ name: 'defaultLogger' });
const reposService = new ReposService(defaultLogger);

export default reposService;
