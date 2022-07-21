import { deploy, run_tests, Test } from 'azle/test';
import { execSync } from 'child_process';

const tests: Test[] = [
    {
        name: 'build',
        prep: async () => {
            execSync(`dfx build backend`, {
                stdio: 'inherit'
            });
        }
    }
];

run_tests(tests);
