import React from 'react';
import StripeCheckout from 'react-stripe-checkout';
import { Mutation } from 'react-apollo';
import Router from 'next/router';
import Nprogress from 'nprogress';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';

import Error from './ErrorMessage';
import User, { CURRENT_USER_QUERY } from './User';

import calcTotalPrice from '../lib/calcTotalPrice';

function totalItems(cart) {
  return cart.reduce((tally, cartItem) => tally + cartItem.quantity, 0);
}

class TakeMyMoney extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
  };

  onToken = res => {
    console.log('On Token Called!');
    console.log(res.id);
  };

  render() {
    const { children } = this.props;

    return (
      <User>
        {({ data: { me } }) => (
          <StripeCheckout
            amount={calcTotalPrice(me.cart)} // cents
            name="Sick Fits"
            description={`Order of ${totalItems(me.cart)} Items`}
            // image={me.cart[0].item && me.cart[0].item.image}
            stripeKey="pk_test_cEovea9qj5Cvi0G4aShoOjUn00aqzah5j7"
            currency="USD"
            email={me.email}
            token={res => this.onToken(res)}
          >
            {children}
          </StripeCheckout>
        )}
      </User>
    );
  }
}

export default TakeMyMoney;
