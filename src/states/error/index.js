import error from './error/index';

export default angular.module('error', ['ui.router']).config(config);


/**
 * @param {!ui.router.$stateProvider} $stateProvider
 *
 * @ngInject
 */
function config($stateProvider) {
    $stateProvider.
        state('error', error);
}
