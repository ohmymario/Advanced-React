import App, { Container } from 'next/app';
import Page from '../components/Page';
import { ApolloProvider } from 'react-apollo';
import withData from '../lib/withData'

class MyApp extends App {

  // Runs before first render
  static async getInitialProps({ Component, ctx }) {
    let pageProps = {};

    // Resolves all queries/mutations and returns data through pageProps
    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }
    // This exposes the query to the user
    pageProps.query = ctx.query;
    return { pageProps };
  }
  render() {
    const { Component, apollo, pageProps } = this.props;

    return (
      // Container from next.js
      <Container>
        <ApolloProvider client={apollo}>
        {/* Props, Metadata, Header/Nav */}
        <Page>
          {/* Directs to page depending on name of page */}
          <Component {...pageProps}/>
        </Page>
        </ApolloProvider>
      </Container>
    );
  }
}

export default withData(MyApp);
