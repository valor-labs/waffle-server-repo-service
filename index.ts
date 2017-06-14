import * as Logger from 'bunyan';
import {ChildProcess} from 'child_process';
import * as fs from 'fs';
import {defaults, includes, pick} from 'lodash';
import * as shell from 'shelljs';
import {ExecOptions} from 'shelljs';

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

// keyof ExecOptions
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
    const {absolutePathToRepos, githubUrl, pathToRepo, branch} = defaults(options, defaultOptions);
    const command = `git -C ${absolutePathToRepos} clone ${githubUrl} ${pathToRepo} -b ${branch}`;
    const execOptions: ExecOptions = this.getExecOptions(options);

    return shell.exec(command, execOptions, (code: number, stdout: string, stderr: string) => {
      const isNotEmptyDirectory = includes(stderr, 'already exists and is not an empty directory');

      if (isNotEmptyDirectory) {
        return callback();
      }

      if (code !== 0) {
        this._logger.error({obj: {code, command, options, stdout, stderr, defaultOptions}});

        return callback(stderr);
      }

      return callback();
    });
  }

  public clone(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const {absolutePathToRepos, githubUrl, pathToRepo, branch} = defaults(options, defaultOptions);
    const command = `git -C ${absolutePathToRepos} clone ${githubUrl} ${pathToRepo} -b ${branch}`;

    return this.runShellJsCommand(command, options, callback);
  }

  public checkoutToBranch(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const {pathToRepo, branch} = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `checkout ${branch}`);

    return this.runShellJsCommand(command, options, callback);
  }

  public checkoutToCommit(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const {pathToRepo, commit} = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `checkout ${commit}`);

    return this.runShellJsCommand(command, options, callback);
  }

  public fetch(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const {pathToRepo} = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `fetch --all --prune`);

    return this.runShellJsCommand(command, options, callback);
  }

  public reset(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const {pathToRepo, branch} = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `reset --hard origin/${branch}`);

    return this.runShellJsCommand(command, options, callback);
  }

  public pull(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const {pathToRepo, branch} = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `pull origin ${branch}`);

    return this.runShellJsCommand(command, options, callback);
  }

  public clean(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const {pathToRepo} = defaults(options, defaultOptions);
    const command = this.wrapGitCommand(pathToRepo, `clean -f -d`);

    return this.runShellJsCommand(command, options, callback);
  }

  public getAmountLines(options: Options, callback: ErrorCallback<string>): ChildProcess {
    const {pathToRepo} = defaults(options, defaultOptions);
    let command = `wc -l ${pathToRepo}/*.csv | grep "total$"`;

    return this.runShellJsCommand(command, options, callback);
  }

  public checkSshKey(options: ExecOptions, callback: ErrorCallback<string>): ChildProcess {
    let command = `ssh -T git@github.com`;

    return shell.exec(command, options, (code: number, stdout: string, stderr: string) => {
      if (code > 1) {
        const error = `[code=${code}] ${stderr}\n\tPlease, follow the detailed instruction 'https://github.com/Gapminder/waffle-server-import-cli#ssh-key' for continue working with CLI tool.`;

        return callback(error);
      }

      return callback();
    });
  }

  public makeDirForce(options: Options, onDirMade: ErrorCallback<string>): void {
    const {pathToRepo} = defaults(options, defaultOptions);

    return fs.exists(pathToRepo, (exists: boolean) => {
      if (!exists) {
        shell.mkdir('-p', pathToRepo);

        return onDirMade(shell.error());
      }

      return onDirMade();
    });
  }

  public removeDirForce(options: Options, onDirCleaned: ErrorCallback<string>): void {
    const {absolutePathToRepos, pathToRepo} = defaults(options, defaultOptions);

    return fs.exists(pathToRepo || absolutePathToRepos, (exists: boolean) => {
      if (!exists) {
        shell.rm('-rf', absolutePathToRepos + '/*');

        return onDirCleaned(shell.error());
      }

      return onDirCleaned(`Directory '${pathToRepo || absolutePathToRepos}' is not exist!`);
    });
  }

  private runShellJsCommand(command: string, options: Options, callback: ErrorCallback<string>): ChildProcess {
    const execOptions: ExecOptions = this.getExecOptions(options);

    return shell.exec(command, execOptions, (code: number, stdout: string, stderr: string) => {
      if (code !== 0) {
        this._logger.error({obj: {code, command, options, stdout, stderr, defaultOptions}});

        return callback(stderr);
      }

      return callback();
    });
  }

  private wrapGitCommand(pathToRepo: string, command: string): string {
    return `git --git-dir=${pathToRepo}/.git --work-tree=${pathToRepo} ${command}`;
  }

  private getExecOptions(options: Options): ExecOptions {
    return pick(options, defaultShellOptions);
  }
}

const defaultLogger = Logger.createLogger({name: 'defaultLogger'});
const reposService = new ReposService(defaultLogger);

export default reposService;
