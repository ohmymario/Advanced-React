import UpdateItem from '../components/UpdateItem';

// You can destructure the query for cleaner look
const Sell = ({ query }) => (
  <div>
    {/* Id needed to populate form */}
    <UpdateItem id={query.id}/>
  </div>
);

export default Sell;
