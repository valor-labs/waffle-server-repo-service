import {createLogger, Logger} from 'bunyan';
import {ChildProcess} from 'child_process';
import {defaults, includes} from 'lodash';
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
        const {gitRepo, githubUrl, pathToRepo, branch} = defaults(options, defaultOptions);
        const command = `${gitRepo} clone ${githubUrl} ${pathToRepo} -b ${branch}`;

        return shell.exec(command, options, (code: number, stdout: string, stderr: string) => {
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
        const {gitRepo, githubUrl, pathToRepo, branch} = defaults(options, defaultOptions);
        const command = `${gitRepo} clone ${githubUrl} ${pathToRepo} -b ${branch}`;

        return this.runShellJsCommand(command, options, callback);
    }

    public checkoutToBranch(options: Options, callback: ErrorCallback<string>): ChildProcess {
        const {gitRepo, branch} = defaults(options, defaultOptions);
        const command = `${gitRepo} checkout ${branch}`;

        return this.runShellJsCommand(command, options, callback);
    }

    public checkoutToCommit(options: Options, callback: ErrorCallback<string>): ChildProcess {
        const {gitRepo, commit} = defaults(options, defaultOptions);
        const command = `${gitRepo} checkout ${commit}`;

        return this.runShellJsCommand(command, options, callback);
    }

    public fetch(options: Options, callback: ErrorCallback<string>): ChildProcess {
        const {gitRepo} = defaults(options, defaultOptions);
        const command = `${gitRepo} fetch --all --prune`;

        return this.runShellJsCommand(command, options, callback);
    }

    public reset(options: Options, callback: ErrorCallback<string>): ChildProcess {
        const {gitRepo, branch} = defaults(options, defaultOptions);
        const command = `${gitRepo} reset --hard origin/${branch}`;

        return this.runShellJsCommand(command, options, callback);
    }

    public pull(options: Options, callback: ErrorCallback<string>): ChildProcess {
        const {gitRepo, branch} = defaults(options, defaultOptions);
        const command = `${gitRepo} pull origin ${branch}`;

        return this.runShellJsCommand(command, options, callback);
    }

    public clean(options: Options, callback: ErrorCallback<string>): ChildProcess {
        const {gitRepo} = defaults(options, defaultOptions);
        const command = `${gitRepo} clean -f -d`;

        return this.runShellJsCommand(command, options, callback);
    }

    private runShellJsCommand(command: string, options: Options, callback: ErrorCallback<string>): ChildProcess {
        return shell.exec(command, options, (code: number, stdout: string, stderr: string) => {
            if (code !== 0) {
                this._logger.error({obj: {code, command, options, stdout, stderr, defaultOptions}});

                return callback(stderr);
            }

            return callback();
        });
    }

}

const defaultLogger = createLogger({name: 'defaultLogger'});
const reposService = new ReposService(defaultLogger);

export default reposService;
