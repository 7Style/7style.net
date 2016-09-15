export default class PostService {
    
    /**
     * @ngInject
     * @param {!angular.$http} $http
     */
    constructor($http) {
    
        /**
         *
         * @type {angular.$http}
         */
        this.http = $http;
    }
    
    
    /**
     * get single post
     *
     * @param {number} productId
     * @return {!angular.$http.HttpPromise}
     */
    getPost(productId) {
        if (!productId) {
            productId = 1;
        }
        return this.http.get('http://jsonplaceholder.typicode.com/posts/' + productId);
        
    }
    
    
    /**
     * get all Posts
     *
     * @return {!angular.$http.HttpPromise} Promise object
     */
    getPosts() {
        return this.http.get('http://jsonplaceholder.typicode.com/posts/');
    }
    
    
}
