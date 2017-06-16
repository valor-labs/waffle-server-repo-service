import * as Logger from 'bunyan';
import { ChildProcess } from 'child_process';
import * as fs from 'fs';
import { defaults, includes, pick, isEmpty, isArray } from 'lodash';
import * as shell from 'shelljs';
import { ExecOptions } from 'shelljs';

export interface DefaultOptions {
  silent: Boolean;
  async: Boolean;
  branch: string;
  commit: string;
  prettifyResult: Function;
}

export interface Options extends Partial<DefaultOptions> {
  absolutePathToRepos: string;
  githubUrl: string;
  pathToRepo: string;
  relativeFilePath?: string;
  files?: string[];
  commitFrom?: string;
  commitTo?: string;
}

// keyof ExecOptions
const defaultShellOptions = ['silent', 'async'];

export const defaultOptions: DefaultOptions = {
  silent: true,
  async: true,
  branch: 'master',
  commit: 'HEAD',
  prettifyResult: (value: string) => value,
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
    const execOptions: ExecOptions = this.getExecOptions(options);

    return shell.exec(command, execOptions, (code: number, stdout: string, stderr: string) => {
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
    const { absolutePathToRepos, pathToRepo, branch } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(absolutePathToRepos, pathToRepo, `checkout ${branch}`);

    return this.runShellJsCommand(command, options, callback);
  }

  public checkoutToCommit(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { absolutePathToRepos, pathToRepo, commit } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(absolutePathToRepos, pathToRepo, `checkout ${commit}`);

    return this.runShellJsCommand(command, options, callback);
  }

  public fetch(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { absolutePathToRepos, pathToRepo } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(absolutePathToRepos, pathToRepo, `fetch --all --prune`);

    return this.runShellJsCommand(command, options, callback);
  }

  public reset(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { absolutePathToRepos, pathToRepo, branch } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(absolutePathToRepos, pathToRepo, `reset --hard origin/${branch}`);

    return this.runShellJsCommand(command, options, callback);
  }

  public pull(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { absolutePathToRepos, pathToRepo, branch } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(absolutePathToRepos, pathToRepo, `pull origin ${branch}`);

    return this.runShellJsCommand(command, options, callback);
  }

  public clean(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const { absolutePathToRepos, pathToRepo } = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(absolutePathToRepos, pathToRepo, `clean -f -d`);

    return this.runShellJsCommand(command, options, callback);
  }

  public log(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const {absolutePathToRepos, pathToRepo} = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(absolutePathToRepos, pathToRepo, `log --pretty=format:%h%n%ad%n%s%n%n`);

    return this.runShellJsCommand(command, options, callback);
  }

  public show(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const {absolutePathToRepos, pathToRepo, commit, relativeFilePath} = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(absolutePathToRepos, pathToRepo, `show ${commit}:${relativeFilePath}`);

    return this.runShellJsCommand(command, options, callback);
  }

  public diff(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const {absolutePathToRepos, pathToRepo, commitFrom, commitTo} = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(absolutePathToRepos, pathToRepo, `diff ${commitFrom} ${commitTo} --name-status --no-renames | grep ".csv$"`);

    return this.runShellJsCommand(command, options, callback);
  }

  public getAmountLines(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const {absolutePathToRepos, pathToRepo, files} = defaults(options, defaultOptions);

    let command = `wc -l ${pathToRepo}/*.csv | grep "total$"`;

    if (isArray(files)) {
      command = isEmpty(files) ? 'echo 0' : `wc -l "${files}" | grep "total$"`;
    }

    return this.runShellJsCommand(command, options, callback);
  }

  public checkSshKey(options: Options, callback: ErrorCallback<string>): ChildProcess {
    let command = `ssh -T git@github.com`;
    const execOptions: ExecOptions = this.getExecOptions(options);

    return shell.exec(command, execOptions, (code: number, stdout: string, stderr: string) => {
      if (code > 1) {
        const error = `[code=${code}]\n${stderr}\nPlease, follow the detailed instruction 'https://github.com/Gapminder/waffle-server-import-cli#ssh-key' for continue working with CLI tool.`;

        return callback(error);
      }

      return callback();
    });
  }

  public makeDirForce(pathToMake: string, onDirMade: ErrorCallback<string>): void {
    return fs.exists(pathToMake, (exists: boolean) => {
      if (!exists) {
        shell.mkdir('-p', pathToMake);

        return onDirMade(shell.error());
      }

      return onDirMade();
    });
  }

  public removeDirForce(pathToRemove: string, onDirRemoved: ErrorCallback<string>): void {
    return fs.exists(pathToRemove, (exists: boolean) => {
      if (!exists) {
        shell.rm('-rf', pathToRemove + '/*');

        return onDirRemoved(shell.error());
      }

      return onDirRemoved(`Directory '${pathToRemove}' is not exist!`);
    });
  }

  private runShellJsCommand(command: string, options: Options, callback: AsyncResultCallback<any, string>): ChildProcess {
    const {prettifyResult} = options;
    const execOptions: ExecOptions = this.getExecOptions(options);

    return shell.exec(command, execOptions, (code: number, stdout: string, stderr: string) => {
      if (code !== 0) {
        this._logger.error({ obj: { code, command, options, stdout, stderr, defaultOptions } });

        return callback(stderr);
      }

      return callback(null, prettifyResult(stdout));
    });
  }

  private wrapGitCommand(absolutePathToRepos: string, pathToRepo:string, command: string): string {
    return `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} ${command}`;
  }

  private getExecOptions(options: Options): ExecOptions {
    return pick(options, defaultShellOptions);
  }
}

const defaultLogger = Logger.createLogger({ name: 'defaultLogger' });
const reposService = new ReposService(defaultLogger);

export default reposService;
