describe('apis(API)', function() {
	describe('hashKey', function() {
		
		it('undefined的hashKey是undefined:undefined', function() {
			expect(hashKey(undefined)).toEqual("undefined:undefined");
		});

		it('null的hashKey是 object:null', function() {
			expect(hashKey(null)).toEqual("object:null");
		});

		it('true的hashKey是 boolean:true', function() {
			expect(hashKey(true)).toEqual("boolean:true");
		});

		it('false的hashKey是 boolean:false', function() {
			expect(hashKey(false)).toEqual("boolean:false");
		});
		it('number 42的hashKey是number:42', function() {
			expect(hashKey(42)).toEqual("number:42");
		});
		it('string 42的hashKey是String:42', function() {
			expect(hashKey("42")).toEqual("string:42");
		});

		it('objects的hashKey是object:[unique id]', function() {
			expect(hashKey({})).toMatch(/^object:\S+$/);
		});

		it('相同对象的hashKey是相同的', function() {
			var obj={};
			expect(hashKey(obj)).toEqual(hashKey(obj));
		});

		it('当object的值改变时hashKey不变', function() {
			var obj={a:42};
			var hash1=hashKey(obj);
			obj.a=43;
			var hash2=hashKey(obj);
			expect(hash1).toEqual(hash2);
		});

		it('不同的对象hashKey不同(就算对象内的值完全相同)', function() {
			var obj1={a:42};
			var obj2={a:42};
			expect(hashKey(obj1)).not.toEqual(hashKey(obj2));
		});

		it('function的hashKey是function:[unique id]', function() {
			var fn=function(a){
				return a;
			};
			expect(hashKey(fn)).toMatch(/^function:\S+$/);
		});

		it('相同function的hashKey相同', function() {
			var fn=function(){};
			expect(hashKey(fn)).toEqual(hashKey(fn));
		});

		it('不同函数的hashKey不同', function() {
			var fn1=function(){return 42;};
			var fn2=function(){return 42;};
			expect(hashKey(fn1)).not.toEqual(hashKey(fn2));
		});

		it('存放hash key 在$$hashKey属性中', function() {
			var obj={a:42};
			var hash=hashKey(obj);
			expect(obj.$$hashKey).toEqual(hash.match(/^object:(\S+)$/)[1]);
		});
		it('如果$$hashKey属性值已存在,使用已存在的', function() {
			expect(hashKey({$$hashKey:42})).toEqual('object:42');
		});

		it('支持$$hashKey是function', function() {
			expect(hashKey({$$hashKey:_.constant(42)})).toEqual("object:42");
		});

		it('调用$$hashKey方法生成hashKey', function() {
			expect(hashKey({
				myKey:42,
				$$hashKey:function(){
					return this.myKey;
				}
			})).toEqual('object:42');
		});

	});

	describe('HashMap', function() {
		it('put,get方法', function() {
			var map=new HashMap();
			map.put(42,'fourty two');
			expect(map.get(42)).toEqual('fourty two');
		});

		it('将object当做hashMap的key', function() {
			var  map=new HashMap();
			var obj={};
			map.put(obj,"my value");
			expect(map.get(obj)).toEqual('my value');
			expect(map.get({})).toBeUndefined();
		});

		it('支持remove 方法', function() {
			var map=new HashMap();
			map.put(42,"fourty two");
			map.remove(42);
			expect(map.get(42)).toBeUndefined();
		});
		it('remove方法需要返回被移除的值', function() {
			var map=new HashMap();
			map.put(42,"fourty two");
			expect(map.remove(42)).toEqual("fourty two");
		});


	});
});