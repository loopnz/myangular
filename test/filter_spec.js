
describe('过滤器filter', function() {
	
	it('注册过滤器', function() {
		var myFilter=function(){};
		var myFilterFactory=function(){
			return myFilter;
		};
		register('my',myFilterFactory);
		expect(filter('my')).toBe(myFilter);
	});

	it('使用对象注册多个过滤器', function() {
		var myFilter=function(){};
		var myFilter2=function(){};
		var myFilterFactory=function(){
			return myFilter;
		};
		var myFilterFactory2=function(){
			return myFilter2;
		};
		register({
			"my":myFilterFactory,
			"my2":myFilterFactory2
		});
		expect(filter('my')).toBe(myFilter);
		expect(filter('my2')).toBe(myFilter2);
	});


});