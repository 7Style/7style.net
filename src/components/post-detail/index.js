import PostService from "services/post-service";

/**
 * @type {angular.Directive}
 */
export default {
    name: 'albumPostDetail',
    templateUrl: '/components/album-post-detail/album-post-detail.html',
    scope: {
        "postId": '@postid',
        "modal": '@modal'
    },
    restrict: 'E',
    link: link,
    controller: controller
};


/**
 *
 * @param {!angular.Scope} scope
 * @param {!Element} element
 * @param {!Object} attrs
 */
function link(scope, element, attrs) {
    var initialing = true;
    var modalBox = element[0].querySelector('.modal-box');
    scope.$watch("modal", () => {
        if (initialing === true) {
            initialing = false;
        } else {
            scope.getPostDetail(modalBox)
        }
    });
}


/**
 *
 * @param {!angular.Scope} $scope
 * @param {!PostService} AlbumPostService Service to store cart info
 * @param {!angular.$log} $log
 *  @ngInject
 */
function controller($scope, AlbumPostService, $log) {
    
    
    /**
     *
     * @type {!number}
     */
    $scope.postId = 0;
    
    
    /**
     *
     * @type {!Object}
     * @export
     */
    $scope.post = {};
    
    
    /**
     *
     * @param element
     */
    $scope.getPostDetail = (element) => {
        AlbumPostService.getPost($scope.postId)
                .then((post) => {
                    $scope.post = post.data;
                })
                .finally(function () {
                    $(element).modal();
                })
                .catch($log.debug);
    };
    
}
