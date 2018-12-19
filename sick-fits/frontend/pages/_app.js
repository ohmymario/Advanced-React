import App, { Container } from 'next/app';
import Page from '../components/Page';

class MyApp extends App {
  render() {
    const { Component } = this.props;

    return (
      // Container from next.js
      <Container>
        {/* Props, Metadata, Header/Nav */}
        <Page>
          {/* Directs to page depending on name of page */}
          <Component />
        </Page>
      </Container>
    );
  }
}

export default MyApp;
