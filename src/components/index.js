import AlbumPostDetail from './post-detail/index'

/**
 *
 * @param {angular.Directive} component
 * @return {!Function}
 */
function factory(component) {
    return function () {
        return component;
    };
}


export default angular.module('components', [])
        .directive(AlbumPostDetail.name,
                factory(AlbumPostDetail)).config(config);

/**
 *
 * @ngInject
 */
function config() {
}
