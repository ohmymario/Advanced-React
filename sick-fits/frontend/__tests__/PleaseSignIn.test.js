import { mount } from 'enzyme';
import wait from 'waait';

import { MockedProvider } from 'react-apollo/test-utils';
import { CURRENT_USER_QUERY } from '../components/User';
import PleaseSignIn from '../components/PleaseSignIn';

import { fakeUser } from '../lib/testUtils';

const notSignedInMocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: { data: { me: null } },
  },
];

const SignedInMocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: { data: { me: fakeUser() } },
  },
];

describe('<PleaseSignIn/>', () => {
  it('renders the sign in dialog to logged out users', async () => {
    const wrapper = mount(
      <MockedProvider mocks={notSignedInMocks}>
        <PleaseSignIn />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    expect(wrapper.text()).toContain('Please Sign In before Continuing');

    const SignIn = wrapper.find('Signin');
    expect(SignIn.exists()).toBe(true);
  });

  it('render the child component when user is signed in', async () => {
    // PleaseSignIn requires a child to function
    const Hey = () => <p>Hey!</p>;
    const wrapper = mount(
      <MockedProvider mocks={SignedInMocks}>
        <PleaseSignIn>
          <Hey />
        </PleaseSignIn>
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    expect(wrapper.contains(<Hey />)).toBe(true);
  });
});
