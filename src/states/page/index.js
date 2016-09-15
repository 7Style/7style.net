import index from './index/index';

export default angular.module('page', ['ui.router']).config(config);

/**
 * @param {!ui.router.$stateProvider} $stateProvider
 * @param {!angular.$logProvider} $logProvider
 *
 * @ngInject
 */
function config($stateProvider, $logProvider) {
    $stateProvider
        .state('page', index)
    
    // @todo must be changed of false on prod
    $logProvider.debugEnabled(true);
}
