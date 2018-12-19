import Link from 'next/link';

// All nav links here
const Nav = () => (
  <div>
    <Link href="/">
      <a>Sell!</a>
    </Link>
    <Link href="/sell">
      <a>Home!</a>
    </Link>
  </div>
);

export default Nav;
