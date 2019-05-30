import withApollo from 'next-with-apollo';
import ApolloClient from 'apollo-boost';
import { endpoint, prodEndpoint } from '../config';

import { LOCAL_STATE_QUERY } from '../components/Cart';

function createClient({ headers }) {
  return new ApolloClient({
    uri: process.env.NODE_ENV === 'development' ? endpoint : endpoint,

    request: operation => {
      operation.setContext({
        fetchOptions: {
          credentials: 'include',
        },
        headers,
      });
    },
    // Local Data(Server)
    clientState: {
      resolvers: {
        Mutation: {
          toggleCart(_, variables, { cache }) {
            // read the cartOpen value from the cache
            const { cartOpen } = cache.readQuery({
              query: LOCAL_STATE_QUERY,
            });
            // Write the cart State to the opposite value
            const data = {
              data: { cartOpen: !cartOpen },
            };
            // Write that new data back into the cache
            cache.writeData(data);
            return data;
          },
        },
      },
      defaults: {
        cartOpen: false,
      },
    },
  });
}

export default withApollo(createClient);
