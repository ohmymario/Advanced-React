import { Query } from 'react-apollo';
import Error from './ErrorMessage';
import gql from 'graphql-tag';
import Table from './styles/Table';
import SickButton from "./styles/SickButton";
import PropTypes from 'prop-types';

const possiblePermissions = [
  'ADMIN',
  'USER',
  'ITEMCREATE',
  'ITEMUPDATE',
  'ITEMDELETE',
  'PERMISSIONUPDATE',
]

const ALL_USERS_QUERY = gql`
  query {
    users {
      id
      name
      email
      permissions
    }
  }
`

const Permissions = (props) => (
  <Query query={ALL_USERS_QUERY}>
    {({data, loading, error}) => (
      <div>
        <Error error={error}/>
        <p>Hey</p>
        <div>
          <h2>Manage Permissions</h2>
          <Table>

            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                {possiblePermissions.map(permission => (
                  <th key={permission}>{permission}</th>
                ))}
                <th>👇</th>
              </tr>
            </thead>

            <tbody>
              {data.users.map(user => (
                <UserPermissions user={user} key={user.id}/>
              ))}
            </tbody>

          </Table>
        </div>
      </div>
    )}
  </Query>
)

// Populates table data w/ user data
class UserPermissions extends React.Component {

  // Check for object with all of these fields
  static propTypes = {
    user: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
      id: PropTypes.string,
      permissions: PropTypes.array,
    }).isRequired,
  };

  // Used as seeding of initial state
  state = {
    permissions: this.props.user.permissions
  };

  handlePermissionChange = (e) => {
    const checkbox = e.target;

    // opy of the current permissions
    let updatedPermissions = [...this.state.permissions];
    console.log(` State copy ${updatedPermissions}`)

    // Logic to remove or add permission
    if(checkbox.checked) {
      // Add
      updatedPermissions.push(checkbox.value)
      console.log(` State copy ${updatedPermissions}`)
    } else {
      // Remove
      updatedPermissions = updatedPermissions.filter(permission => (
        permission !== checkbox.value
      ));
    }

    // Set state to updatedPermissions
    this.setState({ permissions: updatedPermissions})
  }

  render() {
    const user = this.props.user;
    return (
      <tr>

        <td>{user.name}</td>
        <td>{user.email}</td>
        {possiblePermissions.map(permission => (
          <td key={permission}>
            <label htmlFor={`${user.id}-permission-${permission}`}>
            {/* Checked is flipped to "true" if seeded state contains the possiblePermission*/}
              <input
              id={`${user.id}-permission-${permission}`}
              type="checkbox"
              checked={this.state.permissions.includes(permission)}
              value={permission}
              onChange={this.handlePermissionChange}
              />
            </label>
          </td>
        ))}
        <td>
          <SickButton>Update</SickButton>
        </td>

      </tr>
    )
  }
}

export default Permissions;