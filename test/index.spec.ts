/* tslint:disable:no-invalid-this*/
/* tslint:disable:no-unused-expression*/

import * as Logger from 'bunyan';
import { expect } from 'chai';
import { defaults } from 'lodash';
import 'mocha';
import * as shell from 'shelljs';
import * as sinon from 'sinon';
import * as sinonTest from 'sinon-test';

import reposService, { defaultOptions, Options } from '../index';

const sandbox = sinonTest.configureTest(sinon);
const assert = sinon.assert;
const match = sinon.match;

describe('Test Repos Service', () => {
  let logger;
  let errorStub;

  beforeEach(() => {
    logger = Logger.createLogger({ name: 'logger' });
    errorStub = sinon.stub(logger, 'error');
    reposService.logger = logger;
  });

  it('should set new logger instance', () => {
    const testLogger = Logger.createLogger({ name: 'testLogger' });
    expect(reposService.logger).to.not.equal(testLogger);
    reposService.logger = testLogger;
    expect((reposService as any)._logger).to.equal(testLogger);
  });

  it('should clone repo silently when repo wasn\'t cloned before', sandbox(function (done: Function): void {
    const code = 0;
    const stdout = '';
    const stderr = '';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const command = `git -C ${pathToRepo} clone ${githubUrl} ${pathToRepo} -b master`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.silentClone(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('should do nothing if destination path is not empty directory', sandbox(function (done: Function): void {
    const code = 1;
    const stdout = '';
    const stderr = 'fatal: destination path \'ddf--ws-testing\' already exists and is not an empty directory.';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const command = `git -C ${pathToRepo} clone ${githubUrl} ${pathToRepo} -b master`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.silentClone(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('should respond with error when clonning process threw error', sandbox(function (done: Function): void {
    const code = 128;
    const stdout = '';
    const stderr = 'Boo!';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const command = `git -C ${pathToRepo} clone ${githubUrl} ${pathToRepo} -b master`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.silentClone(options, (error: string) => {
      expect(error).to.equal(stderr);

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

      assert.calledOnce(errorStub);
      assert.alwaysCalledWithExactly(errorStub, {
        obj: {
          code,
          command,
          options: defaults(options, defaultOptions),
          defaultOptions,
          stdout,
          stderr
        }
      });

      return done();
    });
  }));

  it('should clone repo successfuly', sandbox(function (done: Function): void {
    const code = 0;
    const stdout = '';
    const stderr = '';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const command = `git -C ${pathToRepo} clone ${githubUrl} ${pathToRepo} -b master`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, async: false, silent: false };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.clone(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('should respond with an error', sandbox(function (done: Function): void {
    const code = 128;
    const stdout = '';
    const stderr = 'Boo!';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const command = `git -C ${pathToRepo} clone ${githubUrl} ${pathToRepo} -b master`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.clone(options, (error: string) => {
      expect(error).to.equal(stderr);

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

      assert.calledOnce(errorStub);
      assert.alwaysCalledWithExactly(errorStub, {
        obj: {
          code,
          command,
          options: defaults(options, defaultOptions),
          defaultOptions,
          stdout,
          stderr
        }
      });

      return done();
    });
  }));

  it('should checkout to branch development', sandbox(function (done: Function): void {
    const code = 0;
    const stdout = '';
    const stderr = '';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const branch = 'development';
    const command = `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} checkout ${branch}`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, branch, async: false, silent: false };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.checkoutToBranch(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('should checkout to master whithout errors, if branch wasn\'t given', sandbox(function (done: Function): void {
    const code = 0;
    const stdout = '';
    const stderr = '';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const command = `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} checkout master`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, async: false, silent: false };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.checkoutToBranch(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('should respond with error when checkout process threw error', sandbox(function (done: Function): void {
    const code = 128;
    const stdout = '';
    const stderr = 'Boo!';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const command = `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} checkout master`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, async: true, silent: true };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.checkoutToBranch(options, (error: string) => {
      expect(error).to.equal(stderr);

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

      assert.calledOnce(errorStub);
      assert.alwaysCalledWithExactly(errorStub, {
        obj: {
          code,
          command,
          options: defaults(options, defaultOptions),
          defaultOptions,
          stdout,
          stderr
        }
      });

      return done();
    });
  }));

  it('should checkout to given commit', sandbox(function (done: Function): void {
    const code = 0;
    const stdout = '';
    const stderr = '';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const commit = 'HEAD';
    const command = `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} checkout ${commit}`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, commit, async: false, silent: false };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.checkoutToCommit(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('should checkout to HEAD, if commit wasn\'t given', sandbox(function (done: Function): void {
    const code = 0;
    const stdout = '';
    const stderr = '';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const command = `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} checkout HEAD`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, async: false, silent: false };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.checkoutToCommit(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('should respond with error when checkout to commit process threw error', sandbox(function (done: Function): void {
    const code = 128;
    const stdout = '';
    const stderr = 'Boo!';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const commit = 'HEAD';
    const command = `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} checkout ${commit}`;

    const options: Options = { absolutePathToRepos, githubUrl, commit, pathToRepo, async: true, silent: true };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.checkoutToCommit(options, (error: string) => {
      expect(error).to.equal(stderr);

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

      assert.calledOnce(errorStub);
      assert.alwaysCalledWithExactly(errorStub, {
        obj: {
          code,
          command,
          options: defaults(options, defaultOptions),
          defaultOptions,
          stdout,
          stderr
        }
      });

      return done();
    });
  }));

  it('should fetch from remote', sandbox(function (done: Function): void {
    const code = 0;
    const stdout = '';
    const stderr = '';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const command = `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} fetch --all --prune`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, async: false, silent: false };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.fetch(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('should respond with error while fetch process threw error', sandbox(function (done: Function): void {
    const code = 128;
    const stdout = '';
    const stderr = 'Boo!';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const command = `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} fetch --all --prune`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, async: true, silent: true };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.fetch(options, (error: string) => {
      expect(error).to.equal(stderr);

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

      assert.calledOnce(errorStub);
      assert.alwaysCalledWithExactly(errorStub, {
        obj: {
          code,
          command,
          options: defaults(options, defaultOptions),
          defaultOptions,
          stdout,
          stderr
        }
      });

      return done();
    });
  }));

  it('should reset to given branch', sandbox(function (done: Function): void {
    const code = 0;
    const stdout = '';
    const stderr = '';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const branch = 'development';
    const command = `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} reset --hard origin/${branch}`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, branch, async: false, silent: false };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.reset(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('should respond with error while reset process threw error', sandbox(function (done: Function): void {
    const code = 128;
    const stdout = '';
    const stderr = 'Boo!';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const branch = 'development';
    const command = `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} reset --hard origin/${branch}`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, branch, async: true, silent: true };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.reset(options, (error: string) => {
      expect(error).to.equal(stderr);

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

      assert.calledOnce(errorStub);
      assert.alwaysCalledWithExactly(errorStub, {
        obj: {
          code,
          command,
          options: defaults(options, defaultOptions),
          defaultOptions,
          stdout,
          stderr
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
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const command = `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} reset --hard origin/master`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, async: false, silent: false };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.reset(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('should make pull request successfully', sandbox(function (done: Function): void {
    const code = 0;
    const stdout = '';
    const stderr = '';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const branch = 'development';
    const command = `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} pull origin ${branch}`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, branch, async: false, silent: false };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.pull(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('should make pull request successfully, when branch wasn\'t given', sandbox(function (done: Function): void {
    const code = 0;
    const stdout = '';
    const stderr = '';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const command = `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} pull origin master`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, async: false, silent: false };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.pull(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('should respond with error when pull request process threw error', sandbox(function (done: Function): void {
    const code = 128;
    const stdout = '';
    const stderr = 'Boo!';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const branch = 'development';
    const command = `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} pull origin ${branch}`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, branch, async: true, silent: true };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.pull(options, (error: string) => {
      expect(error).to.equal(stderr);

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

      assert.calledOnce(errorStub);
      assert.alwaysCalledWithExactly(errorStub, {
        obj: {
          code,
          command,
          options: defaults(options, defaultOptions),
          defaultOptions,
          stdout,
          stderr
        }
      });

      return done();
    });
  }));

  it('should remove untracked files from given directory', sandbox(function (done: Function): void {
    const code = 0;
    const stdout = '';
    const stderr = '';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const command = `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} clean -f -d`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, async: false, silent: false };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.clean(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('should respond with error when cleaning directory from untracked files threw error', sandbox(function (done: Function): void {
    const code = 128;
    const stdout = '';
    const stderr = 'Boo!';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const branch = 'development';
    const command = `git --git-dir=${absolutePathToRepos}${pathToRepo}/.git --work-tree=${absolutePathToRepos}${pathToRepo} clean -f -d`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, branch, async: true, silent: true };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.clean(options, (error: string) => {
      expect(error).to.equal(stderr);

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

      assert.calledOnce(errorStub);
      assert.alwaysCalledWithExactly(errorStub, {
        obj: {
          code,
          command,
          options: defaults(options, defaultOptions),
          defaultOptions,
          stdout,
          stderr
        }
      });

      return done();
    });
  }));

  it('should return amount lines in files in given path', sandbox(function (done: Function): void {
    const code = 0;
    const stdout = '';
    const stderr = '';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const branch = '';
    const command = `wc -l ${absolutePathToRepos}/*.csv | grep "total$"`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, branch, async: false, silent: false };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.getAmountLines(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('should respond with error when cleaning directory from untracked files threw error', sandbox(function (done: Function): void {
    const code = 128;
    const stdout = '';
    const stderr = 'Boo!';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const branch = 'development';
    const command = `wc -l ${absolutePathToRepos}/*.csv | grep "total$"`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, branch, async: true, silent: true };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.getAmountLines(options, (error: string) => {
      expect(error).to.equal(stderr);

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: true, silent: true }, match.func);

      assert.calledOnce(errorStub);
      assert.alwaysCalledWithExactly(errorStub, {
        obj: {
          code,
          command,
          options: defaults(options, defaultOptions),
          defaultOptions,
          stdout,
          stderr
        }
      });

      return done();
    });
  }));

  it('should check ssh key whithout errors', sandbox(function (done: Function): void {
    const code = 0;
    const stdout = '';
    const stderr = '';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const branch = '';
    const command = `ssh -T git@github.com`;

    const options: Options = { absolutePathToRepos, githubUrl, pathToRepo, branch, async: false, silent: false };

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.checkSshKey(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, { async: false, silent: false }, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('should make a dir for a repo', sandbox(function (done: Function): void {
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const option = `-p`;

    const execStub = this.stub(shell, 'mkdir');

    reposService.makeDirForce(pathToRepo, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, option, pathToRepo);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('should remove directory', sandbox(function (done: Function): void {
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const option = `-rf`;

    const execStub = this.stub(shell, 'rm');

    reposService.removeDirForce(pathToRepo, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, option, `${pathToRepo}/*`);

      assert.notCalled(errorStub);

      return done();
    });
  }));
});
