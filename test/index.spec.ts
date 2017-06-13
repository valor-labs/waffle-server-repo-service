/* tslint:disable:no-invalid-this*/
/* tslint:disable:no-unused-expression*/

import {createLogger, Logger} from 'bunyan';
import {expect} from 'chai';
import {defaults} from 'lodash';
import 'mocha';
import * as shell from 'shelljs';
import * as sinon from 'sinon';
import * as sinonTest from 'sinon-test';

import reposService, {defaultOptions, Options} from '../index';

const sandbox = sinonTest.configureTest(sinon);
const assert = sinon.assert;
const match = sinon.match;

describe('Test Repos Service', () => {
  let logger;
  let errorStub;

  beforeEach(() => {
    logger = createLogger({name: 'logger'});
    errorStub = sinon.stub(logger, 'error');
    reposService.logger = logger;
  });

  it('should set new logger instance', () => {
    const testLogger = createLogger({name: 'testLogger'});
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

    const options: Options = {absolutePathToRepos, githubUrl, pathToRepo};

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.silentClone(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, options, match.func);

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

    const options: Options = {absolutePathToRepos, githubUrl, pathToRepo};

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.silentClone(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, options, match.func);

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

    const options: Options = {absolutePathToRepos, githubUrl, pathToRepo};

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.silentClone(options, (error: string) => {
      expect(error).to.equal(stderr);

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, options, match.func);

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

  it('#clone', sandbox(function(done: Function): void {
    const code = 0;
    const stdout = '';
    const stderr = '';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const command = `git -C ${pathToRepo} clone ${githubUrl} ${pathToRepo} -b master`;

    const options: Options = {absolutePathToRepos, githubUrl, pathToRepo, async: false, silent: false};

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.clone(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, {async: false, silent: false}, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));

  it('#checkoutToBranch', sandbox(function(done: Function): void {
    const code = 0;
    const stdout = '';
    const stderr = '';
    const githubUrl = 'git@github.com:VS-work/ddf--ws-testing.git';
    const pathToRepo = '/repos/VS-work/ddf--ws-testing/master';
    const absolutePathToRepos = pathToRepo;
    const branch = 'development';
    const command = `git --git-dir=${pathToRepo}/.git --work-tree=${pathToRepo} checkout ${branch}`;

    const options: Options = {absolutePathToRepos, githubUrl, pathToRepo, branch, async: false, silent: false};

    const execStub = this.stub(shell, 'exec').callsArgWithAsync(2, code, stdout, stderr);

    reposService.checkoutToBranch(options, (error: string) => {
      expect(error).to.not.exist;

      assert.calledOnce(execStub);
      assert.alwaysCalledWithExactly(execStub, command, {async: false, silent: false}, match.func);

      assert.notCalled(errorStub);

      return done();
    });
  }));
});
