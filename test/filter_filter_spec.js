/*jshint globalstrict:true*/
/*global publishExternalAPI:false,createInjector:false*/
'use strict';

describe('过滤器的过滤器(filter filter)', function() {

    var parse;
       beforeEach(function() {
            publishExternalAPI();
            parse=createInjector(['ng']).get('$parse');
        });

    it('通过模块注册filter filter', function() {
        var injector=createInjector(['ng']);
        expect(injector.has('filterFilter')).toBe(true);
    });

/*    it('注册filter filter', function() {
        expect(filter('filter')).toBeDefined();
    });*/

    it('使用断言函数过滤数组', function() {
        var fn = parse('[1,2,3,4]|filter:isOdd');
        var scope = {
            isOdd: function(n) {
                return n % 2 !== 0;
            }
        };
        expect(fn(scope)).toEqual([1, 3]);
    });

    it('可以过滤字符串数组中的字符串', function() {
        var fn = parse('arr|filter:"a"');
        expect(fn({ arr: ['a', 'b', 'a'] })).toEqual(['a', 'a']);
    });

    it('可以根据数组中的字符串的子串来过滤', function() {
        var fn = parse('arr|filter:"o"');
        expect(fn({ arr: ["quick", "brown", "fox"] })).toEqual(['brown', 'fox']);
    });

    it('如果数组中的成员是对象,可以根据对象的属性过滤', function() {
        var fn = parse('arr|filter:"o"');
        expect(fn({
            arr: [
                { f: "john", l: "brown" },
                { f: "jane", l: "fox" },
                { f: "mary", l: "quick" }
            ]
        })).toEqual([
            { f: "john", l: "brown" },
            { f: "jane", l: "fox" }
        ]);
    });

    it('如果数组中的成员是数组,可以根据数组中对象的属性过滤', function() {
        var fn = parse('arr|filter:"o"');
        expect(fn({
            arr: [
                [{ name: 'john' }, { name: 'mary' }],
                [{ name: 'jane' }]
            ]
        })).toEqual([
            [{ name: 'john' }, { name: 'mary' }]
        ]);
    });

    it('根据基本数据类型来过滤---数字', function() {
        var fn = parse('arr|filter:42');
        expect(fn({
            arr: [
                { name: 'john', age: 42 }, { name: 'mary', age: 43 },
                { name: 'jane', age: 44 }
            ]
        })).toEqual([
            { name: 'john', age: 42 }
        ]);
    });


    it('根据基本数据类型来过滤---布尔类型', function() {
        var fn = parse('arr|filter:true');
        expect(fn({
            arr: [
                { name: 'john', age: true }, { name: 'mary', age: true },
                { name: 'jane', age: false }
            ]
        })).toEqual([
            { name: 'john', age: true },
            { name: 'mary', age: true }
        ]);
    });

    it('字符串类型中如果包括数字也会被匹配', function() {
        var fn = parse('arr|filter:42');
        expect(fn({
            arr: ['contains 42']
        })).toEqual(['contains 42']);
    });

    it('过滤null', function() {
        var fn = parse('arr|filter:null');
        expect(fn({ arr: [null, 'not null'] })).toEqual([null]);
    });

    it('匹配字符串形式"null"', function() {
        var fn = parse('arr|filter:"null"');
        expect(fn({ arr: [null, 'not null'] })).toEqual(["not null"]);
    });

    it('不匹配undefined的值', function() {
        var fn = parse('arr|filter:"undefined"');
        expect(fn({ arr: [undefined, 'undefined'] })).toEqual(["undefined"]);
    });

    it('过滤不含有指定字符串的对象', function() {
        var fn = parse('arr|filter:"!o"');
        expect(fn({ arr: ['quick', 'brown', 'fox'] })).toEqual(['quick']);
    });

    it('使用对象的值来过滤', function() {
        var fn = parse('arr|filter:{name:"o"}');
        expect(fn({
            arr: [
                { name: 'joe', role: 'admin' },
                { name: 'jane', role: 'moderator' }
            ]
        })).toEqual([
            { name: 'joe', role: 'admin' }
        ]);
    });

    it('使用对象过滤，必须匹配对象的所有属性', function() {
        var fn = parse('arr|filter:{name:"o",role:"m"}');
        expect(fn({
            arr: [
                { name: 'joe', role: 'admin' },
                { name: 'jane', role: 'moderator' }
            ]
        })).toEqual([
            { name: 'joe', role: 'admin' }
        ]);
    });


    it('使用对象过滤，对象为空返回所有的', function() {
        var fn = parse('arr|filter:{}');
        expect(fn({
            arr: [
                { name: 'joe', role: 'admin' },
                { name: 'jane', role: 'moderator' }
            ]
        })).toEqual([
            { name: 'joe', role: 'admin' },
            { name: 'jane', role: 'moderator' }
        ]);
    });


    it('使用对象过滤，返回不含有指定值的对象', function() {
        var fn = parse('arr|filter:{name:{first:"!o"}}');
        expect(fn({
            arr: [
                { name: { first: 'joe' }, role: 'admin' },
                { name: { first: 'jane' }, role: 'moderator' }
            ]
        })).toEqual([
            { name: { first: 'jane' }, role: 'moderator' }
        ]);
    });

    it('使用对象筛选,忽略对象的undefined值', function() {
        var fn = parse('arr|filter:{name:thisisundefined}');
        expect(fn({
            arr: [
                { name: 'joe', role: 'admin' },
                { name: 'jane', role: 'moderator' }
            ]
        })).toEqual([
            { name: 'joe', role: 'admin' },
            { name: 'jane', role: 'moderator' }
        ]);
    });

    it('如果对象的属性是数组,只要数组有一项匹配就行', function() {
        var fn = parse('arr|filter:{users:{name:{first:"o"}},role:"100-200"}');
        expect(fn({
            arr: [{
                users: [
                    { name: { first: 'joe' }, role: 'admin' },
                    { name: { first: 'jane' }, role: 'moderator' }
                ],
                role: ["100-200", "200-300"]
            }, {
                users: [
                    { name: { first: 'mary' }, role: 'admin' }
                ]
            }]
        })).toEqual([{
            users: [
                { name: { first: 'joe' }, role: 'admin' },
                { name: { first: 'jane' }, role: 'moderator' }
            ],
            role: ["100-200", "200-300"]
        }]);
    });

    it('只匹配相同级别的对象属性', function() {
        var items = [
            { user: 'Bob' },
            { user: { name: 'Bob' } },
            { user: { name: { first: 'Bob' } } }
        ];
        var fn = parse('arr|filter:{user:{name:"Bob"}}');
        expect(fn({ arr: items })).toEqual([{ user: { name: 'Bob' } }]);
    });

    it('使用对象通配符过滤', function() {
        var fn = parse('arr|filter:{$:"o"}');
        expect(fn({
            arr: [
                { name: 'Joe', role: 'admin' },
                { name: 'Jane', role: 'moderator' },
                { name: 'mary', role: 'admin' }
            ]
        })).toEqual([
            { name: 'Joe', role: 'admin' },
            { name: 'Jane', role: 'moderator' }
        ]);
    });

    it('在父级属性下使用通配符过滤', function() {
        var fn = parse('arr|filter:{name:{$:"o"}}');
        var arr = [
            { name: { first: 'Joe', last: 'fox' }, role: 'admin' },
            { name: { first: 'Jane', last: 'quick' }, role: 'moderator' },
            { name: { first: 'mary', last: 'brown' }, role: 'admin' }
        ];

        expect(fn({ arr: arr })).toEqual([
            { name: { first: 'Joe', last: 'fox' }, role: 'admin' },
            { name: { first: 'mary', last: 'brown' }, role: 'admin' }
        ]);
    });

    it('使用通配符过滤基本数据结构', function() {
        var fn = parse('arr|filter:{$:"o"}');
        expect(fn({ arr: ['joe', 'jane', 'mary'] })).toEqual(['joe']);
    });

    it('使用多层通配符过滤', function() {
        var fn = parse('arr|filter:{$:{$:"o"}}');
        var arr = [
            { name: { first: 'Joe' }, role: 'admin' },
            { name: { first: 'Jane' }, role: 'moderator' },
            { name: { first: 'mary' }, role: 'admin' }
        ];

        expect(fn({ arr: arr })).toEqual([
            { name: { first: 'Joe' }, role: 'admin' }
        ]);

    });

    it('使用自定义的比较器', function() {
        var fn = parse('arr|filter:{$:"o"}:myComparator');
        expect(fn({
            arr: ['o', 'ao', 'aa', 'oo'],
            myComparator: function(left, right) {
                return left === right;
            }
        })).toEqual(['o']);
    });

    it('比较的时候使用全等,也就是不要只匹配部分', function() {
        var fn = parse('arr|filter:{name:"Jo"}:true');

        expect(fn({
            arr: [
                { name: 'Jo' },
                { name: 'Joe' }
            ]
        })).toEqual([{ name: 'Jo' }]);

    });

});
