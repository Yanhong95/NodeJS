import React from 'react';

import classes from './Burger.css';
import BurgerIngredient from './BurgerIngredient/BurgerIngredient';

const burger = ( props ) => {
    let transformedIngredients = Object.keys( props.ingredients ) // 这里返回 [ key1. key2, key3, key4 ]
        .map( igKey => {
            return [...Array( props.ingredients[igKey] )].map( ( _, i ) => { // 这里 _ 是空的array的element i是这些element的index. 然后用 <BurgerIngredient />填满
                return <BurgerIngredient key={igKey + i} type={igKey} />;
            } );
        } )// 这上面返回的是多个array [[][][][]] 这样
        .reduce((arr, el) => {
            return arr.concat(el)
        }, []); // reduce 成一个大array []
    if (transformedIngredients.length === 0) {
        transformedIngredients = <p>Please start adding ingredients!</p>;
    }
    return (
        <div className={classes.Burger}>
            <BurgerIngredient type="bread-top" />
            {transformedIngredients}
            <BurgerIngredient type="bread-bottom" />
        </div>
    );
};

export default burger;