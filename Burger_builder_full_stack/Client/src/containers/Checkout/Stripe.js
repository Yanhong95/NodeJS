import React, { Component } from 'react';
import {CardElement, ElementsConsumer} from '@stripe/react-stripe-js';
import { connect } from 'react-redux';
import axios from '../../axios-orders';
import * as actions from '../../store/actions/index';
import Button from '../../components/UI/Button/Button';
import withErrorHandler from '../../hoc/withErrorHandler/withErrorHandler'


class CheckoutForm extends Component {
  handleSubmit = async (event) => {
    // Block native form submission.
    event.preventDefault();

    const {stripe, elements} = this.props;

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    const result = await stripe.confirmCardPayment(this.props.reduxData.client_secret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: this.props.reduxData.currentOrder.orderData.name,
        },
      }
    });

    if (result.error) {
      // Show error to your customer (e.g., insufficient funds)
      console.log(result.error.message);
    } else {
      // The payment has been processed!
      if (result.paymentIntent.status === 'succeeded') {
        this.props.reduxData.onOrderBurger(this.props.reduxData.currentOrder, this.props.reduxData.token);
        // Show a success message to your customer
        // There's a risk of the customer closing the window before callback
        // execution. Set up a webhook or plugin to listen for the
        // payment_intent.succeeded event that handles any business critical
        // post-payment actions.
      }
    }
  };


  render() {
    const {stripe} = this.props;
    return (
      <form onSubmit={this.handleSubmit}>
        <CardElement />
        <Button btnType="Success" disabled={!stripe}>Pay</Button>
      </form>
    );
  }
}



const InjectedCheckoutForm = (props) => {
  return (
    <ElementsConsumer>
      {({elements, stripe}) => (
        <CheckoutForm 
          elements={elements} 
          stripe={stripe} 
          reduxData={props} 
          />
      )}
    </ElementsConsumer>
  );
};

const mapStateToProps = state => {
  return {
      currentOrder: state.order.currentOrder,
      token: state.auth.token,
      userId: state.auth.userId,
      client_secret: state.order.scripe_client_secret
  }
};

const mapDispatchToProps = dispatch => {
  return {
     onOrderBurger: (orderData, token) => dispatch(actions.purchaseBurger(orderData, token))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(withErrorHandler(InjectedCheckoutForm, axios));