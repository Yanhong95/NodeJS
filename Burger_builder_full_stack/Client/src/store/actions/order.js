import * as actionTypes from './actionTypes';
import axios from '../../axios-orders';


export const prepareStripSuccess = ( client_secret, orderData ) => {
    return {
        type: actionTypes.PREPARE_STRIPT_SUCCESS,
        client_secret: client_secret,
        currentOrder: orderData
    };
};

export const prepareStripFail = ( error ) => {
    return {
        type: actionTypes.PREPARE_STRIPT_FAIL,
        error: error
    };
}

export const prepareStripStart = () => {
    return {
        type: actionTypes.PREPARE_STRIPT_START
    };
};

export const prepareStrip = (orderData, token ) => {
    return dispatch => {
        dispatch( prepareStripStart() );
        axios.post( '/orders/prepareStrip', { token, orderData })
        .then( response => {
            dispatch( prepareStripSuccess( response.data.client_secret, orderData ) );
        } )
        .catch( error => {
            dispatch( prepareStripFail( error ) );
        } );
    }
}

export const purchaseBurgerSuccess = ( id, orderData ) => {
    return {
        type: actionTypes.PURCHASE_BURGER_SUCCESS,
        orderId: id,
        orderData: orderData
    };
};

export const purchaseBurgerFail = ( error ) => {
    return {
        type: actionTypes.PURCHASE_BURGER_FAIL,
        error: error
    };
}

export const purchaseBurgerStart = () => {
    return {
        type: actionTypes.PURCHASE_BURGER_START
    };
};

export const purchaseBurger = ( orderData, token ) => {
    return dispatch => {
        dispatch( purchaseBurgerStart() );
        axios.post( '/orders/placeOrder', { orderData, token })
            .then( response => {
                dispatch( purchaseBurgerSuccess( response.data._id, orderData ) );
            } )
            .catch( error => {
                dispatch( purchaseBurgerFail( error ) );
            } );
    };
};

export const purchaseInit = () => {
    return {
        type: actionTypes.PURCHASE_INIT
    };
};

export const fetchOrdersSuccess = ( orders ) => {
    return {
        type: actionTypes.FETCH_ORDERS_SUCCESS,
        orders: orders
    };
};

export const fetchOrdersFail = ( error ) => {
    return {
        type: actionTypes.FETCH_ORDERS_FAIL,
        error: error
    };
};

export const fetchOrdersStart = () => {
    return {
        type: actionTypes.FETCH_ORDERS_START
    };
};

export const fetchOrders = (token, userId) => {
    return dispatch => {
        dispatch(fetchOrdersStart());
        const queryParams = '?auth=' + token;
        axios.get( '/orders/getMyOrder' + queryParams)
            .then( res => {
                const fetchedOrders = [];
                for ( let key in res.data ) {
                    fetchedOrders.push( {
                        ...res.data[key],
                        id: key
                    } );
                }
                dispatch(fetchOrdersSuccess(fetchedOrders));
            } )
            .catch( err => {
                dispatch(fetchOrdersFail(err));
            } );
    };
};