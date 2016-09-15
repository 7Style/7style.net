import ErrorViewModel from './error-vm';
import {ensureLogout} from 'middleware/middleware';

/**
 * @type {ui.router.State}
 */
export default {
    name: 'error',
    url: '/error',
    templateUrl: '/states/error/error/error.html',
    controller: ErrorViewModel,
    controllerAs: 'error'
};
