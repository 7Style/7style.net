import IndexViewModel from './index-vm';

/**
 * @type {ui.router.State}
 */
export default  {
    // abstract: true,
    name: 'page',
    url: '/',
    templateUrl: '/states/page/index/index.html',
    controller: IndexViewModel,
    controllerAs: 'home'
}
