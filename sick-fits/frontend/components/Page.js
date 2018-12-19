import React, { Component } from 'react';
import Header from '../components/Header';
import Meta from '../components/Meta';

// All components needed in all Pages
class Page extends Component {
  render() {
    return (
      <div>
        <Meta />
        <Header />
        {this.props.children}
      </div>
    );
  }
}

export default Page;
