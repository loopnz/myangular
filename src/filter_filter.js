function filterFilter() {
    return function(arr, filterExpr) {
        var predicateFn;
        if (_.isFunction(filterExpr)) {
            predicateFn = filterExpr;
        } else if (_.isString(filterExpr)) {
            predicateFn = createPredicateFn(filterExpr);
        } else {
            return array;
        }
        return _.filter(arr, predicateFn);
    };
}

function createPredicateFn(expression) {

    function comparator(actual,expected) {
        actual = actual.toLowerCase();
        expected = expression.toLowerCase();
        return actual.indexOf(expected) !== -1;
    }

    return function(item){
    	return deepCompare(item,expression,comparator);
    };
}

function deepCompare(actual,expected,comparator){
	if(_.isObject(actual)){
		return _.some(actual,function(value){
			return comparator(value,expected);
		});
	}else{
		return comparator(actual,expected);
	}

}

register('filter', filterFilter);
