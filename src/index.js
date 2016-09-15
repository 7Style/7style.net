import Services from './services/index';
import States from './states/index';
import Components from './components/index';


let dependencies = [
    'ui.router',
    Services.name,
    States.name,
    Components.name
];

angular.module('page-app', dependencies).config(config).run(run);


/**
 * @param {!angular.$locationProvider} $locationProvider State provider.
 * @param {!ui.router.$urlRouterProvider} $urlRouterProvider Router provider.
 *
 * @ngInject
 */
function config($locationProvider, $urlRouterProvider) {
    $locationProvider.html5Mode({enabled: true, requireBase: false});
    $urlRouterProvider.otherwise('/error');
}


/**
 * @param {!angular.Scope} $rootScope Root scope service.
 * @param {!ui.router.$state} $state Location service.
 *
 * @ngInject
 */
function run($rootScope, $state) {
    $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, eventObj) {
        event.preventDefault();
        // if we're trying to reach to login but an error occured, it's
        // probably due to the fact that we are already logged in. So just
        // redirect to the shop interface
        
        var state = 'error';
        
        if (toState.name == state)
            state = 'page';
        else
            console.log('route change error to', toState.name, ':', event);
        
        console.log('redirecting to', state);
    
        /**
         *
         * @type {string}
         */
        $rootScope.title = "Index";
        $state.go(state);
    });
    
}
