import test from './test';
import development from './development';

/**
 * @define {string}
 */
var env = 'development';


let config = {
    'development': development,
    'test': test
};

export default config[env];
