/**
 * A generated module for MetaDotfiles functions
 *
 * This module has been generated via dagger init and serves as a reference to
 * basic module structure as you get started with Dagger.
 *
 * The first line in this comment block is a short description line and the
 * rest is a long description with more detail on the module's purpose or usage,
 * if appropriate. All modules should have a short description.
 */

import { dag, Container, Directory, object, argument, func } from "@dagger.io/dagger"

@object()
export class MetaDotfiles {
  /**
  * The repo root directory to operate on
  */
  @func()
  repo: Directory;

  isCI: string;

  constructor(
    /**
    * The repo root directory to operate on (will be calculated automatically)
    */
    @argument({
      defaultPath: '/',
      ignore: [
        '**',
        '!.tool-versions',
        '!src/**',
        '!bun.lockb',
        '!package.json',
        '!tsconfig.json'
      ]
    })
    repo: Directory,
    /**
     * Pass 'true' to render GitHub Actions grouping marks in output
     */
    isCI: string = 'false'
  ) {
    this.repo = repo;
    this.isCI = isCI;
  }

  /**
   * Returns a container for a Bun build environment
   */
  private async buildEnvironment (): Promise<Container> {
    const toolVersions = await this.repo.file('.tool-versions').contents();
    // parse string as space-separated key-value pairs delimited by line breaks
    const versions: {
      [key: string]: string;
    }  = toolVersions.split('\n').reduce((acc, line) => {
      const [key, value] = line.split(' ');
      acc[key] = value;
      return acc;
    }, {});

    return dag
      .container()
      .from(`oven/bun:${versions.bun}`)
      .withDirectory("/work", this.repo)
      .withWorkdir("/work")
      // Fool Bun into outputting GHA annotations.
      .withEnvVariable('GITHUB_ACTIONS', this.isCI)
      .withExec(["bun", "install"]);
  }

  /**
   * Returns a container after linting the provided source directory
   */
  @func()
  async lint (): Promise<Container> {
    return (await this.buildEnvironment())
      .withExec(["bun", "run", "lint"]);
  }

  /**
   * Returns a linted container after running unit tests
   */
  @func()
  async test (): Promise<Container> {
    return (await this.buildEnvironment())
      .withExec(["bun", "run", "test:unit"]);
  }

  /**
   * Returns the output of unit testing with coverage information
   */
  @func()
  async coverage (): Promise<string> {
    return (await this.test())
      .stderr();
  }

  /**
   * Returns a container after successfully building the tested binary
   */
  @func()
  async build (): Promise<Container> {
    return (await this.buildEnvironment())
      .withExec(["bun", "run", "compile"]);
  }

  /**
   * Returns a container after running integration tests
   */
  @func()
  async integrationTest (): Promise<Container> {
    return (await this.build())
      .withExec(["bun", "run", "ci:test:e2e"]);
  }

  /**
   * Returns the build artifact of all lints and tests passing
   */
  @func()
  async runCi (
    @argument({
      defaultPath: '/',
      ignore: [
        '**',
        '!.tool-versions',
        '!src/**',
        '!bun.lockb',
        '!package.json',
        '!tsconfig.json'
      ]
    })
    repo: Directory
  ): Promise<string> {
    const [ , coverage] = await Promise.all([
      (await this.lint(repo)).sync(),
      this.coverage(repo),
      (await this.integrationTest(repo)).sync()
    ]);
    return coverage;
  }

  /**
   * Returns a container after bundling the source directory
   */
  @func()
  async release (): Promise<Directory> {
    return (await this.build()).directory('./build/bin');
  }
}
