/*jshint globalstrict:true*/
/*global angular:false,publishExternalAPI:false,createInjector:false*/
'use strict';
describe('过滤器filter', function() {

    beforeEach(function() {
        publishExternalAPI();
    });

/*   it('注册过滤器', function() {
        var myFilter = function() {};
        var myFilterFactory = function() {
            return myFilter;
        };
        register('my', myFilterFactory);
        expect(filter('my')).toBe(myFilter);
    });

    it('使用对象注册多个过滤器', function() {
        var myFilter = function() {};
        var myFilter2 = function() {};
        var myFilterFactory = function() {
            return myFilter;
        };
        var myFilterFactory2 = function() {
            return myFilter2;
        };
        register({
            "my": myFilterFactory,
            "my2": myFilterFactory2
        });
        expect(filter('my')).toBe(myFilter);
        expect(filter('my2')).toBe(myFilter2);
    });*/

    it('使用模块注册过滤器', function() {
        var myFilter = function() {};
        var myFilterFactory = function() {
            return myFilter;
        };
        var injector = createInjector(['ng', function($filterProvider) {
            $filterProvider.register('my', myFilterFactory);
        }]);
        var $filter = injector.get('$filter');
        expect($filter('my')).toBe(myFilter);
    });


    it('使用模块使用对象注册多个过滤器', function() {
        var myFilter = function() {};
        var myFilter2 = function() {};
        var myFilterFactory = function() {
            return myFilter;
        };
        var myFilterFactory2 = function() {
            return myFilter2;
        };
        var injector = createInjector(['ng', function($filterProvider) {
            $filterProvider.register({
                "my": myFilterFactory,
                "my2": myFilterFactory2
            });
        }]);
        var $filter = injector.get('$filter');
        expect($filter('my')).toBe(myFilter);
        expect($filter('my2')).toBe(myFilter2);
    });
    it('通过$filterproivider注册过滤器', function() {
    	var  my=function(){};
    	var injector=createInjector(['ng',function($filterProvider){

    		$filterProvider.register('my',function(){
    			return my;
    		});
    	}]);

    	expect(injector.has('myFilter')).toBe(true);
    	expect(injector.get('myFilter')).toBe(my);

    });

    it('通过$filterproivider注册过滤器时,添加过滤器依赖', function() {
    	var injector=createInjector(['ng',function($provide,$filterProvider){
    		$provide.constant("suffix",'!');
    		$filterProvider.register('my',function(suffix){
    			return function(v){
    				return suffix+v;
    			};
    		});
    	}]);

    	expect(injector.has('myFilter')).toBe(true);
    	
    });

    it('通过模块API注册过滤器', function() {
    	var my=function(){};
    	var module=angular.module('myModule',[]);
    	module.filter('my',function(){
    		return my;
    	});

    	var injector=createInjector(['ng','myModule']);
    	expect(injector.get('myFilter')).toBe(my);
    });


});
