import cliTest from './cli.test.ts';

import executable from '../../build/test/dfi' with { type: 'file' };

cliTest(executable);
