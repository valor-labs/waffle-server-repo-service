import { createLogger, Logger } from 'bunyan';
import { ChildProcess } from 'child_process';
import { defaults, includes, pick } from 'lodash';
import * as shell from 'shelljs';

export interface DefaultOptions {
  silent: Boolean;
  async: Boolean;
  branch: string;
  commit: string;
}

export interface Options extends Partial<DefaultOptions> {
  absolutePathToRepos: string;
  githubUrl: string;
  pathToRepo: string;
}

export interface ShellOptions {
  silent?: Boolean;
  async?: Boolean;
}

const defaultShellOptions = ['silent', 'async'];

export const defaultOptions: DefaultOptions = {
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
    const { absolutePathToRepos, githubUrl, pathToRepo, branch } = defaults(options, defaultOptions);
    const command = `git -C ${absolutePathToRepos} clone ${githubUrl} ${pathToRepo} -b ${branch}`;

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
    const { absolutePathToRepos, githubUrl, pathToRepo, branch } = defaults(options, defaultOptions);
    const command = `git -C ${absolutePathToRepos} clone ${githubUrl} ${pathToRepo} -b ${branch}`;

    return this.runShellJsCommand(command, options, callback);
  }

  public checkoutToBranch(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { pathToRepo, branch } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo,`checkout ${branch}`);

    return this.runShellJsCommand(command, options, callback);
  }

  public checkoutToCommit(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { pathToRepo, commit } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo,`checkout ${commit}`);

    return this.runShellJsCommand(command, options, callback);
  }

  public fetch(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { pathToRepo } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo,`fetch --all --prune`);

    return this.runShellJsCommand(command, options, callback);
  }

  public reset(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { pathToRepo, branch } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `reset --hard origin/${branch}`);

    return this.runShellJsCommand(command, options, callback);
  }

  public pull(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { pathToRepo, branch } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `pull origin ${branch}`);

    return this.runShellJsCommand(command, options, callback);
  }

  public clean(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { pathToRepo } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo,`clean -f -d`);

    return this.runShellJsCommand(command, options, callback);
  }

  private runShellJsCommand(command: string, options: Options, callback: ErrorCallback<string>): ChildProcess {
    const _options: ShellOptions = this.getShellOptions(options);

    return shell.exec(command, _options, (code: number, stdout: string, stderr: string) => {
      if (code !== 0) {
        this._logger.error({ obj: { code, command, options, stdout, stderr, defaultOptions } });

        return callback(stderr);
      }

      return callback();
    });
  }

  private wrapGitCommand(pathToRepo: string, command: string): string {
    return `git --git-dir=${pathToRepo}/.git --work-tree=${pathToRepo} ${command}`;
  }

  private getShellOptions(options: Options): ShellOptions {
    return pick(options, defaultShellOptions);
  }
}

const defaultLogger = createLogger({ name: 'defaultLogger' });
const reposService = new ReposService(defaultLogger);

export default reposService;
