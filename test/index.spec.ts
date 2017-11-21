/* tslint:disable:no-invalid-this*/
/* tslint:disable:no-unused-expression*/

import * as Logger from 'bunyan';
import { expect } from 'chai';
import * as fs from 'fs';
import { defaults } from 'lodash';
import 'mocha';
import * as path from 'path';
import * as shell from 'shelljs';
import { ExecOptions } from 'shelljs';
import * as sinon from 'sinon';
import * as sinonTest from 'sinon-test';
import {
  reposService,
  LinesAmountOptions,
  CloneOptions,
  defaultOptions,
  DiffOptions,
  DirOptions,
  Options,
  ShowOptions
} from '../index';

const sandbox = sinonTest.configureTest(sinon);
const assert = sinon.assert;
const match = sinon.match;

describe('Repos Service', () => {
  let logger;
  let errorStub;
  let infoStub;

  beforeEach(() => {
    logger = Logger.createLogger({ name: 'logger' });
    errorStub = sinon.stub(logger, 'error');
    infoStub = sinon.stub(logger, 'info');
    reposService.logger = logger;
  });

  it('should set new logger instance', () => {
    const testLogger = Logger.createLogger({ name: 'testLogger' });
    expect(reposService.logger).to.not.equal(testLogger);
    reposService.logger = testLogger;
    expect((reposService as any)._logger).to.equal(testLogger);
  });

  describe('#silentClone', () => {
    it('should clone repo silently when repo wasn\'t cloned before', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing/master';
      const absolutePathToRepos = path.resolve(process.cwd(), relativePathToRepo);
      const command = `git -C ${absolutePathToRepos} clone ${githubUrl} ${relativePathToRepo} -b master`;

      const options: CloneOptions = { absolutePathToRepos, githubUrl, relativePathToRepo };

      const prettifyResultStub = this.spy(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.silentClone(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.notCalled(errorStub);

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        return done();
      });
    }));

    it('should do nothing if destination path is not empty directory', sandbox(function (done: Function): void {
      const code = 1;
      const stdout = '';
      const stderr = 'fatal: destination path \'ddf--ws-testing\' already exists and is not an empty directory.';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing/master';
      const absolutePathToRepos = path.resolve(process.cwd(), relativePathToRepo);
      const command = `git -C ${absolutePathToRepos} clone ${githubUrl} ${relativePathToRepo} -b master`;

      const options: CloneOptions = { absolutePathToRepos, githubUrl, relativePathToRepo };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.silentClone(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.calledOnce(errorStub);
        assert.alwaysCalledWithExactly(errorStub, {
          obj: {
            source: 'repo-service',
            code,
            command,
            options: defaults(options, defaultOptions),
            defaultOptions,
            stdout,
            stderr
          }
        });

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));

    it('should respond with error when clonning process threw error', sandbox(function (done: Function): void {
      const code = 128;
      const stdout = '';
      const stderr = 'Boo!';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing/master';
      const absolutePathToRepos = path.resolve(process.cwd(), relativePathToRepo);
      const command = `git -C ${absolutePathToRepos} clone ${githubUrl} ${relativePathToRepo} -b master`;
      const expectedError = 'Unexpected error [code=128]: silentClone';

      const options: CloneOptions = { absolutePathToRepos, githubUrl, relativePathToRepo };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.silentClone(options, (error: string) => {
        expect(error).to.equal(expectedError);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.calledOnce(errorStub);
        assert.alwaysCalledWithExactly(errorStub, {
          obj: {
            source: 'repo-service',
            code,
            command,
            options: defaults(options, defaultOptions),
            defaultOptions,
            stdout,
            stderr
          }
        });

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));

    it('should respond with trimmed error when clonning process threw error', sandbox(function (done: Function): void {
      const code = 128;
      const stdout = '';
      const stderr = `Cloning into '/home/waffle-server/dwd/ddf/Gapminder/ddf--pcbs--census/features/flattened'...
        ERROR: Repository not found.
            fatal: Could not read from remote repository.

            Please make sure you have the correct access rights
        and the repository exists.`;
      const expectedError = 'Unexpected error [code=128]: silentClone';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const relativePathToRepo = 'repos/VS-work/ddf--ws-testing/master';
      const absolutePathToRepos = path.resolve(process.cwd(), relativePathToRepo);
      const command = `git -C ${absolutePathToRepos} clone ${githubUrl} ${relativePathToRepo} -b master`;

      const options: CloneOptions = {absolutePathToRepos, githubUrl, relativePathToRepo};

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.silentClone(options, (error: string) => {
        expect(error).to.equal(expectedError);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, {async: true, silent: true}, match.func);

        assert.calledOnce(errorStub);
        assert.alwaysCalledWithExactly(errorStub, {
          obj: {
            source: 'repo-service',
            code,
            command,
            options: defaults(options, defaultOptions),
            defaultOptions,
            stdout,
            stderr
          }
        });

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));
  });

  describe('#clone', () => {
    it('should clone repo successfuly', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} clone ${githubUrl} ${pathToRepo} -b master`;

      const options: Options = { githubUrl, pathToRepo, async: false, silent: false };

      const prettifyResultStub = this.spy(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.clone(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        assert.notCalled(errorStub);

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));

    it('should respond with an error', sandbox(function (done: Function): void {
      const code = 128;
      const stdout = '';
      const stderr = 'Boo!';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} clone ${githubUrl} ${pathToRepo} -b master`;
      const expectedError = 'Unexpected error [code=128]: clone';

      const options: Options = { githubUrl, pathToRepo };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.clone(options, (error: string) => {
        expect(error).to.equal(expectedError);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.calledOnce(errorStub);
        assert.alwaysCalledWithExactly(errorStub, {
          obj: {
            source: 'repo-service',
            code,
            command,
            options: defaults(options, defaultOptions),
            defaultOptions,
            stdout,
            stderr
          }
        });

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));
  });

  describe('#checkoutToBranch', () => {
    it('should checkout to branch development', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';
      const branch = 'development';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} checkout ${branch}`;

      const options: Options = { githubUrl, pathToRepo, branch, async: false, silent: false };

      const prettifyResultStub = this.spy(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.checkoutToBranch(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        assert.notCalled(errorStub);

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));

    it('should checkout to master without errors, if branch wasn\'t given', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} checkout master`;

      const options: Options = { githubUrl, pathToRepo, async: false, silent: false };

      const prettifyResultStub = this.spy(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.checkoutToBranch(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        assert.notCalled(errorStub);

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));

    it('should respond with error when checkout process threw error', sandbox(function (done: Function): void {
      const code = 128;
      const stdout = '';
      const stderr = 'Boo!';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} checkout master`;
      const expectedError = 'Unexpected error [code=128]: checkoutToBranch';

      const options: Options = { githubUrl, pathToRepo, async: true, silent: true };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.checkoutToBranch(options, (error: string) => {
        expect(error).to.equal(expectedError);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.calledOnce(errorStub);
        assert.alwaysCalledWithExactly(errorStub, {
          obj: {
            source: 'repo-service',
            code,
            command,
            options: defaults(options, defaultOptions),
            defaultOptions,
            stdout,
            stderr
          }
        });

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));
  });

  describe('#checkoutToCommit', () => {
    it('should checkout to given commit', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';
      const commit = 'HEAD';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} checkout ${commit}`;

      const options: Options = { githubUrl, pathToRepo, commit, async: false, silent: false };

      const prettifyResultStub = this.spy(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.checkoutToCommit(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        assert.notCalled(errorStub);

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));

    it('should checkout to HEAD, if commit wasn\'t given', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} checkout HEAD`;

      const options: Options = { githubUrl, pathToRepo, async: false, silent: false };

      const prettifyResultStub = this.spy(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.checkoutToCommit(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        assert.notCalled(errorStub);

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));

    it('should respond with error when checkout to commit process threw error', sandbox(function (done: Function): void {
      const code = 128;
      const stdout = '';
      const stderr = 'Boo!';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';
      const commit = 'HEAD';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} checkout ${commit}`;
      const expectedError = 'Unexpected error [code=128]: checkoutToCommit';

      const options: Options = { githubUrl, commit, pathToRepo, async: true, silent: true };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.checkoutToCommit(options, (error: string) => {
        expect(error).to.equal(expectedError);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.calledOnce(errorStub);
        assert.alwaysCalledWithExactly(errorStub, {
          obj: {
            source: 'repo-service',
            code,
            command,
            options: defaults(options, defaultOptions),
            defaultOptions,
            stdout,
            stderr
          }
        });

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));
  });

  describe('#fetch', () => {
    it('should fetch from remote', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} fetch --all --prune`;

      const options: Options = { githubUrl, pathToRepo, async: false, silent: false };

      const prettifyResultStub = this.spy(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.fetch(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        assert.notCalled(errorStub);

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));

    it('should respond with error while fetch process threw error', sandbox(function (done: Function): void {
      const code = 128;
      const stdout = '';
      const stderr = 'Boo!';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} fetch --all --prune`;
      const expectedError = 'Unexpected error [code=128]: fetch';

      const options: Options = { githubUrl, pathToRepo, async: true, silent: true };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.fetch(options, (error: string) => {
        expect(error).to.equal(expectedError);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.calledOnce(errorStub);
        assert.alwaysCalledWithExactly(errorStub, {
          obj: {
            source: 'repo-service',
            code,
            command,
            options: defaults(options, defaultOptions),
            defaultOptions,
            stdout,
            stderr
          }
        });

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));
  });

  describe('#reset', () => {
    it('should reset to given branch', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';
      const branch = 'development';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} reset --hard origin/${branch}`;

      const options: Options = { githubUrl, pathToRepo, branch, async: false, silent: false };

      const prettifyResultStub = this.spy(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.reset(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        assert.notCalled(errorStub);

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));

    it('should respond with error while reset process threw error', sandbox(function (done: Function): void {
      const code = 128;
      const stdout = '';
      const stderr = 'Boo!';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';
      const branch = 'development';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} reset --hard origin/${branch}`;
      const expectedError = 'Unexpected error [code=128]: reset';

      const options: Options = { githubUrl, pathToRepo, branch, async: true, silent: true };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.reset(options, (error: string) => {
        expect(error).to.equal(expectedError);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.calledOnce(errorStub);
        assert.alwaysCalledWithExactly(errorStub, {
          obj: {
            source: 'repo-service',
            code,
            command,
            options: defaults(options, defaultOptions),
            defaultOptions,
            stdout,
            stderr
          }
        });

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));

    it('should reset succesfuly to master, when branch wasn\'t given', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';

      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} reset --hard origin/master`;

      const options: Options = { githubUrl, pathToRepo, async: false, silent: false };

      const prettifyResultStub = this.spy(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.reset(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        assert.notCalled(errorStub);

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));
  });

  describe('#pull', () => {
    it('should make pull request successfully', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';

      const branch = 'development';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} pull origin ${branch}`;

      const options: Options = { githubUrl, pathToRepo, branch, async: false, silent: false };

      const prettifyResultStub = this.spy(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.pull(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        assert.notCalled(errorStub);

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));

    it('should make pull request successfully, when branch wasn\'t given', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';

      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} pull origin master`;

      const options: Options = { githubUrl, pathToRepo, async: false, silent: false };

      const prettifyResultStub = this.spy(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.pull(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        assert.notCalled(errorStub);

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));

    it('should respond with error when pull request process threw error', sandbox(function (done: Function): void {
      const code = 128;
      const stdout = '';
      const stderr = 'Boo!';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';

      const branch = 'development';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} pull origin ${branch}`;
      const expectedError = 'Unexpected error [code=128]: pull';

      const options: Options = { githubUrl, pathToRepo, branch, async: true, silent: true };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.pull(options, (error: string) => {
        expect(error).to.equal(expectedError);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.calledOnce(errorStub);
        assert.alwaysCalledWithExactly(errorStub, {
          obj: {
            source: 'repo-service',
            code,
            command,
            options: defaults(options, defaultOptions),
            defaultOptions,
            stdout,
            stderr
          }
        });

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));
  });

  describe('#clean', () => {
    it('should remove untracked files from given directory', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';

      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} clean -f -d`;

      const options: Options = { githubUrl, pathToRepo, async: false, silent: false };

      const prettifyResultStub = this.spy(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.clean(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        assert.notCalled(errorStub);

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));

    it('should respond with error when cleaning directory from untracked files threw error', sandbox(function (done: Function): void {
      const code = 128;
      const stdout = '';
      const stderr = 'Boo!';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';

      const branch = 'development';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} clean -f -d`;
      const expectedError = 'Unexpected error [code=128]: clean';

      const options: Options = { githubUrl, pathToRepo, branch, async: true, silent: true };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.clean(options, (error: string) => {
        expect(error).to.equal(expectedError);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.calledOnce(errorStub);
        assert.alwaysCalledWithExactly(errorStub, {
          obj: {
            source: 'repo-service',
            code,
            command,
            options: defaults(options, defaultOptions),
            defaultOptions,
            stdout,
            stderr
          }
        });

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));
  });

  describe('#log', () => {
    it('should run git log in pretty format', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} log --pretty=format:%h%n%at%n%ad%n%s%n%n`;
      const prettifyResultStub = this.stub(defaultOptions, 'prettifyResult')
        .returns([{ hash: '1231231', date: Date.now(), fullDate: new Date(), message: 'text' }]);

      const options: Options = { githubUrl, pathToRepo, async: true, silent: true };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.log(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.notCalled(errorStub);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        return done();
      });
    }));

    it('should transfer into log a custom function to proccess result instead of default one', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '123 test';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} log --pretty=format:%h%n%at%n%ad%n%s%n%n`;
      const expectedPrettifiedResult = [{ hash: '1231231', date: Date.now(), fullDate: new Date(), message: 'text' }];
      const prettifyResultStub = this.stub(defaultOptions, 'prettifyResult')
        .returns(expectedPrettifiedResult);

      const options: Options = { githubUrl, pathToRepo, prettifyResult: prettifyResultStub, async: true, silent: true };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.log(options, (error: string, result: number) => {
        expect(error).to.not.exist;
        expect(result).to.equal(expectedPrettifiedResult);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.notCalled(errorStub);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        return done();
      });
    }));

    it('should respond with error when running git log process threw error', sandbox(function (done: Function): void {
      const code = 128;
      const fullDate = new Date();
      const date = +fullDate;
      const stdout = `1231231\n${date}\n${fullDate}\ntext`;
      const stderr = 'Boo!';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} log --pretty=format:%h%n%at%n%ad%n%s%n%n`;
      const expectedError = 'Unexpected error [code=128]: log';
      const prettifyResultStub = this.stub(defaultOptions, 'prettifyResult')
        .returns([{ hash: '1231231', date: Date.now(), fullDate: new Date(), message: 'text' }]);

      const options: Options = { githubUrl, pathToRepo, async: true, silent: true, prettifyResult: prettifyResultStub };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.log(options, (error: string) => {
        expect(error).to.equal(expectedError);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.calledOnce(errorStub);
        assert.alwaysCalledWithExactly(errorStub, {
          obj: {
            code,
            command,
            options: defaults(options, defaultOptions),
            defaultOptions,
            source: 'repo-service',
            stdout,
            stderr
          }
        });

        assert.notCalled(prettifyResultStub);

        return done();
      });
    }));
  });

  describe('#show', () => {
    it('should run git show without errors', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const relativeFilePath = 'lang/nl-nl';
      const commit = 'HEAD';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} show ${commit}:${relativeFilePath}`;

      const options: ShowOptions = { commit, githubUrl, relativeFilePath, pathToRepo, async: true, silent: true };

      const prettifyResultStub = this.spy(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.show(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        assert.notCalled(errorStub);

        return done();
      });
    }));

    it('should run git show without errors when path to file doesn\'t exist', sandbox(function (done: Function): void {
      const code = 110;
      const stdout = '';
      const commit = 'aaaaaaa';
      const relativeFilePath = 'lang/nl-nl/filename.csv';
      const stderr = 'fatal: Path \'' + relativeFilePath + '\' does not exist in \'' + commit + '\'';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} show ${commit}:${relativeFilePath}`;

      const options: ShowOptions = { commit, githubUrl, relativeFilePath, pathToRepo, async: true, silent: true };

      const prettifyResultStub = this.spy(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.show(options, (error: string, result: string) => {
        expect(error).to.not.exist;
        expect(result).to.equal('');

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.notCalled(prettifyResultStub);
        assert.calledOnce(errorStub);
        assert.alwaysCalledWithExactly(errorStub, {
          obj: {
            code,
            command,
            options: defaults(options, defaultOptions),
            defaultOptions,
            source: 'repo-service',
            stdout,
            stderr
          }
        });

        return done();
      });
    }));

    it('should run git show without errors when file exists on disk but doesn\'t exist in certain commit', sandbox(function (done: Function): void {
      const code = 100;
      const stdout = '';
      const relativeFilePath = 'lang/nl-nl/filename.csv';
      const commit = 'HEAD';
      const stderr = relativeFilePath + ' exists on disk, but not in ' + commit;
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} show ${commit}:${relativeFilePath}`;

      const options: ShowOptions = { commit, githubUrl, relativeFilePath, pathToRepo, async: true, silent: true };

      const prettifyResultStub = this.spy(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.show(options, (error: string, result: string) => {
        expect(error).to.not.exist;
        expect(result).to.equal('');

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.notCalled(prettifyResultStub);

        assert.calledOnce(errorStub);
        assert.alwaysCalledWithExactly(errorStub, {
          obj: {
            code,
            command,
            options: defaults(options, defaultOptions),
            defaultOptions,
            source: 'repo-service',
            stdout,
            stderr
          }
        });

        return done();
      });
    }));

    it('should transfer into show a custom function to proccess result instead of default one', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '123 test';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const relativeFilePath = 'lang/nl-nl';
      const commit = 'HEAD';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} show ${commit}:${relativeFilePath}`;
      const prettifyResult = this.stub().callsFake((result: string) => parseInt(result, 10));

      const options: ShowOptions = {
        commit,
        githubUrl,
        relativeFilePath,
        prettifyResult,
        pathToRepo,
        async: true,
        silent: true
      };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.show(options, (error: string, result: number) => {
        expect(error).to.not.exist;
        expect(result).to.equal(123);

        assert.calledOnce(prettifyResult);
        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.notCalled(errorStub);

        return done();
      });
    }));

    it('should respond with error when running git show process threw error', sandbox(function (done: Function): void {
      const code = 128;
      const stdout = '';
      const stderr = 'Boo!';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const relativeFilePath = 'lang/nl-nl';
      const commit = 'HEAD';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} show ${commit}:${relativeFilePath}`;
      const expectedError = 'Unexpected error [code=128]: show';

      const options: ShowOptions = { commit, relativeFilePath, githubUrl, pathToRepo, async: true, silent: true };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.show(options, (error: string) => {
        expect(error).to.equal(expectedError);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.calledOnce(errorStub);
        assert.alwaysCalledWithExactly(errorStub, {
          obj: {
            code,
            command,
            options: defaults(options, defaultOptions),
            defaultOptions,
            source: 'repo-service',
            stdout,
            stderr
          }
        });

        return done();
      });
    }));
  });

  describe('#diff', () => {
    it('should run git diff between commits', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = `A\tfilename.csv\nM\tfilename2.csv\nD\tfilename3.csv`;
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const commitTo = 'HEAD^';
      const commitFrom = 'HEAD~3';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} diff ${commitFrom} ${commitTo} --name-status --no-renames | grep ".csv$"`;
      const expectedPrettifiedResult = { 'filename.csv': 'A', 'filename2.csv': 'M', 'filename3.csv': 'D' };

      const prettifyResultStub = this.stub()
        .callsFake((resultGitDiff: string) => resultGitDiff
          .split('\n')
          .reduce((result: any, rawFile: string) => {
            const [status, filename] = rawFile.split('\t');
            result[filename] = status;
            return result;
          }, {}));
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      const options: DiffOptions = {
        pathToRepo,
        githubUrl,
        commitFrom,
        commitTo,
        prettifyResult: prettifyResultStub,
        async: true,
        silent: true
      };

      reposService.diff(options, (error: string, result: any) => {
        expect(error).to.not.exist;
        expect(result).to.deep.equal(expectedPrettifiedResult);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        assert.notCalled(errorStub);

        return done();
      });
    }));

    it('should transfer into diff a custom function to proccess result instead of default one', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '123 test';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const commitTo = 'HEAD^';
      const commitFrom = 'HEAD~3';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} diff ${commitFrom} ${commitTo} --name-status --no-renames | grep ".csv$"`;
      const expectedPrettifiedResult = { 'filename.csv': 'A', 'filename2.csv': 'M', 'filename3.csv': 'D' };

      const prettifyResultStub = this.stub().returns(expectedPrettifiedResult);
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      const options: DiffOptions = {
        pathToRepo,
        githubUrl,
        commitFrom,
        prettifyResult: prettifyResultStub,
        commitTo,
        async: true,
        silent: true
      };

      reposService.diff(options, (error: string, result: number) => {
        expect(error).to.not.exist;
        expect(result).to.equal(expectedPrettifiedResult);

        assert.calledOnce(prettifyResultStub);
        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.notCalled(errorStub);

        return done();
      });
    }));

    it('should response with an error, while run git diff', sandbox(function (done: Function): void {
      const code = 128;
      const stdout = '';
      const stderr = 'Boo!';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const commitTo = 'HEAD^';
      const commitFrom = 'HEAD~3';
      const command = `git --git-dir=${pathToRepo}.git --work-tree=${pathToRepo} diff ${commitFrom} ${commitTo} --name-status --no-renames | grep ".csv$"`;
      const expectedError = 'Unexpected error [code=128]: diff';

      const options: DiffOptions = { commitFrom, commitTo, githubUrl, pathToRepo, async: true, silent: true };

      const prettifyResultStub = this.stub().returns({});
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.diff(options, (error: string) => {
        expect(error).to.equal(expectedError);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.calledOnce(errorStub);
        assert.alwaysCalledWithExactly(errorStub, {
          obj: {
            code,
            command,
            options: defaults(options, defaultOptions),
            defaultOptions,
            source: 'repo-service',
            stdout,
            stderr
          }
        });

        assert.notCalled(prettifyResultStub);
        return done();
      });
    }));
  });

  describe('#getLinesAmount', () => {
    it('should return lines amount in files in given path', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '123';
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';
      const branch = '';
      const command = `wc -l ${pathToRepo}/*.csv | grep "total$"`;

      const prettifyResultStub = this.stub().callsFake((result: string) => parseInt(result, 10));
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      const options: Options = {
        githubUrl,
        pathToRepo,
        branch,
        prettifyResult: prettifyResultStub,
        async: false,
        silent: false
      };

      reposService.getLinesAmount(options, (error: string, result: number) => {
        expect(error).to.not.exist;
        expect(result).to.equal(123);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        assert.notCalled(errorStub);

        return done();
      });
    }));

    it('should transfer into get-lines-amount a custom function to proccess result instead of default one', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = `123 \n test`;
      const stderr = '';
      const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const branch = '';
      const command = `wc -l ${pathToRepo}/*.csv | grep "total$"`;
      const prettifyResultStub = this.stub().callsFake((result: string) => parseInt(result, 10));

      const options: Options = {
        githubUrl,
        pathToRepo,
        branch,
        prettifyResult: prettifyResultStub,
        async: false,
        silent: false
      };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.getLinesAmount(options, (error: string, result: number) => {
        expect(error).to.not.exist;
        expect(result).to.equal(123);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

        assert.notCalled(errorStub);

        assert.calledOnce(prettifyResultStub);
        assert.alwaysCalledWithExactly(prettifyResultStub, stdout);

        return done();
      });
    }));

    it('should return "echo 0", if given files is empty array', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '0';
      const stderr = '';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const files = [];
      const command = `echo 0`;

      const options: LinesAmountOptions = { files, pathToRepo, async: false, silent: false };

      const prettifyStub = this.stub(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.getLinesAmount(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

        assert.calledOnce(prettifyStub);
        assert.alwaysCalledWithExactly(prettifyStub, stdout);

        assert.notCalled(errorStub);

        return done();
      });
    }));

    it('should return lines amount in given files, if it\'s not an empty array', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '';
      const stderr = '';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const files = ['test-one.cvs', 'test-two.cvs'];
      const command = `wc -l "${files}" | grep "total$"`;

      const options: LinesAmountOptions = { files, pathToRepo, async: false, silent: false };

      const prettifyStub = this.stub(defaultOptions, 'prettifyResult');
      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.getLinesAmount(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

        assert.calledOnce(prettifyStub);
        assert.alwaysCalledWithExactly(prettifyStub, stdout);

        assert.notCalled(errorStub);

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));

    it('should respond with error when cleaning directory from untracked files threw error', sandbox(function (done: Function): void {
      const code = 128;
      const stdout = '';
      const stderr = 'Boo!';
      const pathToRepo = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master') + '/';

      const command = `wc -l ${pathToRepo}/*.csv | grep "total$"`;
      const expectedError = 'Unexpected error [code=128]: getLinesAmount';

      const options: LinesAmountOptions = { pathToRepo, async: true, silent: true };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.getLinesAmount(options, (error: string) => {
        expect(error).to.equal(expectedError);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

        assert.calledOnce(errorStub);
        assert.alwaysCalledWithExactly(errorStub, {
          obj: {
            source: 'repo-service',
            code,
            command,
            options: defaults(options, defaultOptions),
            defaultOptions,
            stdout,
            stderr
          }
        });

        assert.calledOnce(infoStub);
        assert.alwaysCalledWithExactly(infoStub, {
          obj: {
            source: 'repo-service',
            message: 'runShellJsCommand',
            command,
            options
          }
        });

        return done();
      });
    }));
  });

  describe('#checkSshKey', () => {
    it('should check ssh key whithout errors', sandbox(function (done: Function): void {
      const code = 0;
      const stdout = '';
      const stderr = '';
      const command = `ssh -T git@github.com`;

      const options: ExecOptions = { async: false, silent: false };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.checkSshKey(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false, process: 'checkSshKey' }, match.func);

        assert.notCalled(errorStub);
        assert.notCalled(infoStub);

        return done();
      });
    }));

    it('should respond with an error message, while check ssh key', sandbox(function (done: Function): void {
      const code = 128;
      const stdout = '';
      const stderr = `Boo!`;
      const command = `ssh -T git@github.com`;
      const expectedError = `[code=${code}]\n${stderr}\nPlease, follow the detailed instruction 'https://github.com/Gapminder/waffle-server-import-cli#ssh-key' for continue working with CLI tool.`;

      const execOptions: ExecOptions = { async: true, silent: true };

      const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

      reposService.checkSshKey(execOptions, (error: string) => {
        expect(error).to.equal(expectedError);

        assert.calledOnce(execStub);
        assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true, process: 'checkSshKey' }, match.func);

        return done();
      });
    }));
  });

  describe('#makeDirForce', () => {
    it('should make a dir for a repo', sandbox(function (done: Function): void {
      const pathToDir = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const commandOption = `-p`;

      const options: DirOptions = { pathToDir };

      const shellErrStub = this.stub(shell, 'error');
      const existsStub = this.stub(fs, 'exists').callsArgWithAsync(1, null, false);
      const mkdirStub = this.stub(shell, 'mkdir');

      reposService.makeDirForce(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(shellErrStub);

        assert.calledOnce(existsStub);
        assert.alwaysCalledWithExactly(existsStub, pathToDir, match.func);

        assert.calledOnce(mkdirStub);
        assert.alwaysCalledWithExactly(mkdirStub, commandOption, pathToDir);

        assert.notCalled(errorStub);

        return done();
      });
    }));

    it('should do nothing, if path exists', sandbox(function (done: Function): void {
      const pathToDir = process.cwd();

      const options: DirOptions = { pathToDir };

      const execStub = this.stub(shell, 'mkdir');
      const shellErrStub = this.stub(shell, 'error');
      const existsStub = this.stub(fs, 'exists').callsArgWithAsync(1, pathToDir, true);

      reposService.makeDirForce(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(existsStub);
        assert.alwaysCalledWithExactly(existsStub, pathToDir, match.func);

        assert.notCalled(execStub);
        assert.notCalled(shellErrStub);
        assert.notCalled(errorStub);
        assert.notCalled(infoStub);

        return done();
      });
    }));
  });

  describe('#removeDirForce', () => {
    it('should remove directory', sandbox(function (done: Function): void {
      const pathToDir = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const commandOption = `-rf`;

      const options: DirOptions = { pathToDir };

      const shellErrStub = this.stub(shell, 'error');
      const rmStub = this.stub(shell, 'rm');
      const existsStub = this.stub(fs, 'exists').callsArgWithAsync(1, true);

      reposService.removeDirForce(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(existsStub);
        assert.alwaysCalledWithExactly(existsStub, pathToDir, match.func);

        assert.calledOnce(rmStub);
        assert.alwaysCalledWithExactly(rmStub, commandOption, `${pathToDir}/*`);

        assert.calledOnce(shellErrStub);

        assert.notCalled(errorStub);

        return done();
      });
    }));

    it('should remove directory', sandbox(function (done: Function): void {
      const expectectedError = 'Boo!';
      const pathToDir = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const commandOption = `-rf`;

      const options: DirOptions = { pathToDir };

      const shellErrStub = this.stub(shell, 'error').returns(expectectedError);
      const rmStub = this.stub(shell, 'rm');
      const existsStub = this.stub(fs, 'exists').callsArgWithAsync(1, true);

      reposService.removeDirForce(options, (error: string) => {
        expect(error).to.equal(expectectedError);

        assert.calledOnce(existsStub);
        assert.alwaysCalledWithExactly(existsStub, pathToDir, match.func);

        assert.calledOnce(rmStub);
        assert.alwaysCalledWithExactly(rmStub, commandOption, `${pathToDir}/*`);

        assert.calledOnce(shellErrStub);

        assert.notCalled(errorStub);

        return done();
      });
    }));

    it('should try to remove absent directory when silent option was given', sandbox(function (done: Function): void {
      const pathToDir = path.resolve(process.cwd(), '/repos/VS-work/ddf--ws-testing/master');
      const commandOption = `-rf`;

      const options: DirOptions = { pathToDir, silent: true };

      const shellErrorStub = this.stub(shell, 'error');
      const rmStub = this.stub(shell, 'rm');
      const existsStub = this.stub(fs, 'exists').callsArgWithAsync(1, false);

      reposService.removeDirForce(options, (error: string) => {
        expect(error).to.not.exist;

        assert.calledOnce(existsStub);
        assert.alwaysCalledWithExactly(existsStub, pathToDir, match.func);

        assert.notCalled(rmStub);
        assert.notCalled(shellErrorStub);
        assert.notCalled(errorStub);

        return done();
      });
    }));

    it('should response with error, if path exists', sandbox(function (done: Function): void {
      const pathToDir = process.cwd();
      const options: DirOptions = { pathToDir };
      const expectedError = `Directory '${options.pathToDir}' is not exist!`;

      const rmStub = this.stub(shell, 'rm');
      const existsStub = this.stub(fs, 'exists').callsArgWithAsync(1, false);
      const shellErrStub = this.stub(shell, 'error');

      reposService.removeDirForce(options, (error: string) => {
        expect(error).to.equal(expectedError);

        assert.calledOnce(existsStub);
        assert.alwaysCalledWithExactly(existsStub, pathToDir, match.func);

        assert.notCalled(rmStub);
        assert.notCalled(errorStub);
        assert.notCalled(shellErrStub);

        return done();
      });
    }));
  });
});
