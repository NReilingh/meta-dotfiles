/**
 * A generated module for MetaDotfiles functions
 *
 * This module has been generated via dagger init and serves as a reference to
 * basic module structure as you get started with Dagger.
 *
 * Two functions have been pre-created. You can modify, delete, or add to them,
 * as needed. They demonstrate usage of arguments and return types using simple
 * echo and grep commands. The functions can be called from the dagger CLI or
 * from one of the SDKs.
 *
 * The first line in this comment block is a short description line and the
 * rest is a long description with more detail on the module's purpose or usage,
 * if appropriate. All modules should have a short description.
 */

import { dag, Container, Directory, object, func } from "@dagger.io/dagger"

@object()
class MetaDotfiles {
  /**
   * Returns a container for a Bun build environment
   */
  private async buildEnvironment (source: Directory): Promise<Container> {
    const toolVersions = await source.file('.tool-versions').contents();
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
      .withDirectory("/src", source)
      .withWorkdir("/src")
      .withExec(["bun", "install"]);
  }

  /**
   * Returns a container after linting the provided source directory
   */
  @func()
  async lint (source: Directory): Promise<Container> {
    return (await this.buildEnvironment(source))
      .withExec(["bun", "run", "lint"]);
  }

  /**
   * Returns a linted container after running tests
   */
  @func()
  async test (source: Directory): Promise<Container> {
    return (await this.buildEnvironment(source))
      .withExec(["bun", "run", "test"]);
  }

  /**
   * Returns the output of testing with coverage information
   */
  @func()
  async coverage (source: Directory): Promise<string> {
    return (await this.test(source))
      .stderr();
  }

  /**
   * Returns a container after successfully building the tested binary
   */
  @func()
  async build (source: Directory): Promise<Container> {
    return (await this.buildEnvironment(source))
      .withExec(["bun", "run", "compile"]);
  }

  /**
   * Returns the build artifact of all lints and tests passing
   */
  @func()
  async runCi (source: Directory): Promise<string> {
    const [ , coverage] = await Promise.all([
      this.lint(source),
      this.coverage(source),
      this.build(source)
    ]);
    return coverage;
  }

  /**
   * Returns a container after bundling the source directory
   */
  @func()
  async release (source: Directory): Promise<Directory> {
    return (await this.build(source)).directory('./build/bin');
  }
}
