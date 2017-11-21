import * as Logger from 'bunyan';
import { ChildProcess } from 'child_process';
import * as fs from 'fs';
import { defaults, includes, isArray, isEmpty, pick, assign, some } from 'lodash';
import * as path from 'path';
import * as shell from 'shelljs';
import { ExecOptions } from 'shelljs';
import * as async from 'async';

export interface RSErrorCallback<T> {
  (err?: T): void;
}

export interface RSAsyncResultCallback<T, E> {
  (err?: E, result?: T): void;
}

export interface DefaultOptions {
  silent: Boolean;
  async: Boolean;
  branch: string;
  commit: string;
  prettifyResult: Function;
  process?: string;
}

export interface Options extends Partial<DefaultOptions> {
  githubUrl: string;
  pathToRepo: string;
}

export interface CloneOptions extends Partial<DefaultOptions> {
  absolutePathToRepos: string;
  relativePathToRepo: string;
  githubUrl: string;
}

export interface ShowOptions extends Options {
  relativeFilePath: string;
}

export interface DiffOptions extends Options {
  commitFrom: string;
  commitTo: string;
}

export interface LinesAmountOptions extends Partial<DefaultOptions> {
  pathToRepo?: string;
  files?: string[];
}

export interface DirOptions extends Partial<DefaultOptions> {
  pathToDir: string;
}

// keyof ExecOptions
const defaultShellOptions = ['silent', 'async'];

// default allowed shell errors
const allowedShellErrors = {
  NOT_EMPTY_DIR: 'already exists and is not an empty directory',
  FILE_EXISTS_ON_DISK_BUT_NOT_IN_COMMIT: 'exists on disk, but not in',
  FILE_DOES_NOT_EXIST_IN_COMMIT: 'does not exist in',
  SSH_KEY_INSTRUCTION: 'Please, follow the detailed instruction \'https://github.com/Gapminder/waffle-server-import-cli#ssh-key\' for continue working with CLI tool.'
};

export const defaultOptions: DefaultOptions = {
  silent: true,
  async: true,
  branch: 'master',
  commit: 'HEAD',
  prettifyResult: (value: string) => value
};

class ReposService {
  private _logger: Logger;

  public constructor(logger: Logger) {
    this._logger = logger;
  }

  public set logger(logger: Logger) {
    this._logger = logger;
  }

  public silentClone(options: CloneOptions, callback: RSErrorCallback<string>): ChildProcess {
    const { absolutePathToRepos, githubUrl, relativePathToRepo, branch } = defaults(options, defaultOptions);
    const command = `git -C ${absolutePathToRepos} clone ${githubUrl} ${relativePathToRepo} -b ${branch}`;
    assign(options, {process: 'silentClone'});

    return this.runShellJsCommand(command, options, (error: string) => {
      const isNotEmptyDirectory = includes(error, allowedShellErrors.NOT_EMPTY_DIR);

      if (isNotEmptyDirectory) {
        return callback();
      }

      return callback(trimmedError);
    });
  }

  public clone(options: Options, callback: RSErrorCallback<string>): ChildProcess {
    const { githubUrl, pathToRepo, branch } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `clone ${githubUrl} ${pathToRepo} -b ${branch}`);
    assign(options, {process: 'clone'});

    return this.runShellJsCommand(command, options, callback);
  }

  public checkoutToBranch(options: Options, callback: RSErrorCallback<string>): ChildProcess {
    const { pathToRepo, branch } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `checkout ${branch}`);
    assign(options, {process: 'checkoutToBranch'});

    return this.runShellJsCommand(command, options, callback);
  }

  public checkoutToCommit(options: Options, callback: RSErrorCallback<string>): ChildProcess {
    const { pathToRepo, commit } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `checkout ${commit}`);
    assign(options, {process: 'checkoutToCommit'});

    return this.runShellJsCommand(command, options, callback);
  }

  public fetch(options: Options, callback: RSErrorCallback<string>): ChildProcess {
    const { pathToRepo } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `fetch --all --prune`);
    assign(options, {process: 'fetch'});

    return this.runShellJsCommand(command, options, callback);
  }

  public reset(options: Options, callback: RSErrorCallback<string>): ChildProcess {
    const { pathToRepo, branch } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `reset --hard origin/${branch}`);
    assign(options, {process: 'reset'});

    return this.runShellJsCommand(command, options, callback);
  }

  public pull(options: Options, callback: RSErrorCallback<string>): ChildProcess {
    const { pathToRepo, branch } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `pull origin ${branch}`);
    assign(options, {process: 'pull'});

    return this.runShellJsCommand(command, options, callback);
  }

  public clean(options: Options, callback: RSErrorCallback<string>): ChildProcess {
    const { pathToRepo } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `clean -f -x`);
    assign(options, {process: 'clean'});

    return this.runShellJsCommand(command, options, callback);
  }

  public log(options: Options, callback: RSAsyncResultCallback<any, string>): ChildProcess {
    const { pathToRepo } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `log --pretty=format:%h%n%at%n%ad%n%s%n%n`);
    assign(options, {process: 'log'});

    return this.runShellJsCommand(command, options, callback);
  }

  public show(options: ShowOptions, callback: RSAsyncResultCallback<any, string>): ChildProcess {
    const { pathToRepo, commit, relativeFilePath } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `show ${commit}:${relativeFilePath}`);
    assign(options, {process: 'show'});

    return this.runShellJsCommand(command, options, (error: string, result: string) => {
      const isNotExistFile = includes(error, `fatal: Path '${relativeFilePath}' ${allowedShellErrors.FILE_DOES_NOT_EXIST_IN_COMMIT} '${commit}'`);
      const isNotInCommit = includes(error, allowedShellErrors.FILE_EXISTS_ON_DISK_BUT_NOT_IN_COMMIT);

      if (isNotExistFile || isNotInCommit) {
        return callback(null, '');
      }

      return callback(error, result);
    });
  }

  public diff(options: DiffOptions, callback: RSAsyncResultCallback<any, string>): ChildProcess {
    const { pathToRepo, commitFrom, commitTo } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `diff ${commitFrom} ${commitTo} --name-status --no-renames | grep ".csv$"`);
    assign(options, {process: 'diff'});

    return this.runShellJsCommand(command, options, callback);
  }

  public getLinesAmount(options: LinesAmountOptions, done: RSAsyncResultCallback<any, string>): void {
    const { pathToRepo, files } = defaults(options, defaultOptions);
    assign(options, {process: 'getLinesAmount'});
    const pathToRepoFiles = path.resolve(pathToRepo, '*.csv');

    return async.reduce(files || [pathToRepoFiles], 0, async.apply(this.getLinesAmountForFile.bind(this), options), done);
  }

  public checkSshKey(execOptions: ExecOptions, callback: RSErrorCallback<string>): ChildProcess {
    const command = `ssh -T git@github.com`;
    assign(execOptions, {process: 'checkSshKey'});

    return shell.exec(command, execOptions, (code: number, stdout: string, stderr: string) => {
      if (code > 1) {
        const error = `[code=${code}]\n${stderr}\n${allowedShellErrors.SSH_KEY_INSTRUCTION}`;

        return callback(error);
      }

      return callback();
    });
  }

  public makeDirForce(options: DirOptions, onDirMade: RSErrorCallback<string>): void {
    return fs.exists(options.pathToDir, (exists: boolean) => {
      if (!exists) {
        shell.mkdir('-p', options.pathToDir);

        return onDirMade(shell.error());
      }

      return onDirMade();
    });
  }

  public removeDirForce(options: DirOptions, onDirRemoved: RSErrorCallback<string>): void {
    return fs.exists(options.pathToDir, (exists: boolean) => {
      if (exists) {
        shell.rm('-rf', options.pathToDir + '/*');

        return onDirRemoved(shell.error());
      }

      if (options.silent) {
        return onDirRemoved();
      }

      return onDirRemoved(`Directory '${options.pathToDir}' is not exist!`);
    });
  }

  private getLinesAmountForFile(options: LinesAmountOptions, linesAmount: number, filepath: string, callback: RSAsyncResultCallback<number, string>): void {
    const command = 'wc -l ' + filepath + ' | grep "total$"';

    this.runShellJsCommand(command, options, (error: string, result: number): void => {
      return callback(error, linesAmount + result);
    });
  }

  private runShellJsCommand(command: string, options: Options | CloneOptions | LinesAmountOptions, callback: RSAsyncResultCallback<any, string>): ChildProcess {
    const { prettifyResult, process } = options;
    const execOptions: ExecOptions = this.getExecOptions(options);

    this._logger.info({ obj: { source: 'repo-service', message: 'runShellJsCommand', command, options } });

    return shell.exec(command, execOptions, (code: number, stdout: string, stderr: string) => {
      if (code !== 0) {
        this._logger.error({obj: {source: 'repo-service', code, command, options, stdout, stderr, defaultOptions}});

        const isErrorAllowed = some(allowedShellErrors, (allowedShellError: string) => includes(stderr, allowedShellError));
        const error = isErrorAllowed ? stderr : `Unexpected error [code=${code}]: ${process}`;

        return callback(error);
      }

      return callback(null, prettifyResult(stdout));
    });
  }

  private wrapGitCommand(pathToRepo: string, command: string): string {
    return `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} ${command}`;
  }

  private getExecOptions(options: Options | CloneOptions | LinesAmountOptions): ExecOptions {
    return pick(options, defaultShellOptions);
  }
}

const defaultLogger = Logger.createLogger({ name: 'defaultLogger' });
const reposService = new ReposService(defaultLogger);

export {
  reposService
};
