describe('parse', function() {
	
	it('解析integer', function() {
		var fn=parse('42');
		expect(fn).toBeDefined();
		expect(fn()).toBe(42);
	});


});