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
  private buildEnvironment (source: Directory): Container {
    return dag
      .container()
      .from("oven/bun:1.1.8")
      .withDirectory("/src", source)
      .withWorkdir("/src")
      .withExec(["bun", "install"]);
  }

  /**
   * Returns a container after linting the provided source directory
   */
  @func()
  async lint (source: Directory): Promise<Container> {
    return this.buildEnvironment(source)
      .withExec(["bun", "run", "lint"])
      .sync();
  }

  /**
   * Returns a linted container after running tests
   */
  @func()
  async test (source: Directory): Promise<Container> {
    return this.buildEnvironment(source)
      .withExec(["bun", "run", "test"])
      .sync();
  }

  /**
   * Returns a container after successfully building the tested binary
   */
  @func()
  async build (source: Directory): Promise<Container> {
    return this.buildEnvironment(source)
      .withExec(["bun", "run", "compile"])
      .sync();
  }

  /**
   * Returns the build artifact of all lints and tests passing
   */
  @func()
  async runCi (source: Directory): Promise<Directory> {
    const [ ,, built] = await Promise.all([
      this.lint(source),
      this.test(source),
      this.build(source)
    ]);
    return built.directory('./build/bin');
  }
}
