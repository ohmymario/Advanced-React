import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Router from 'next/router';

import Form from './styles/Form';
import PriceTag from './styles/PriceTag';
import Error from '../components/ErrorMessage'

const CREATE_ITEM_MUTATION = gql`
  mutation CREATE_ITEM_MUTATION(
    $title: String!
    $description: String!
    $price: Int!
    $image: String
    $largeImage: String
  ) {
    createItem(
      title: $title
      description: $description
      price: $price
      image: $image
      largeImage: $largeImage
    ) {
      id
    }
  }
`;

class CreateItem extends Component {

  state = {
    title: 'Title',
    description: 'this is the description',
    image: 'image goes here',
    largeImage: 'largerdogimage.jpg',
    price: 2000,
  }

  handleChange = (e) => {
    const {name, type, value} = e.target;
    // Changes value based on Datatype
    const val = type === 'number' ? parseFloat(value) : value;
    this.setState({ [name]: val })
  }

  // Uploading Images to Cloudinary
  uploadFile = async e => {
    const files = e.target.files;
    const data = new FormData();
    
    data.append('file', files[0]);
    // Preset is the same name as in Cloudinary
    data.append('upload_preset', 'sickfits');

    const res = await 
    fetch('https://api.cloudinary.com/v1_1/dosxuuaky/image/upload', {
      method: 'POST',
      body: data,
    });

    const file = await res.json();
    this.setState({
      image: file.secure_url,
      largeImage: file.eager[0].secure_url
    });
};

  render() {
    return (

      <Mutation
        mutation={CREATE_ITEM_MUTATION}
        variables={this.state}>
        {(createItem, { loading, error }) => (

          <Form onSubmit={async e => {
            // Stop the form from submitting
            e.preventDefault();
            // Call the mutation
            const res = await createItem();
            // Redirect to single item page
            console.log(res);
            Router.push({
              pathname: '/item',
              query: { id: res.data.createItem.id }
            })
          }}>
            <Error error={error}/>
            <fieldset disabled={loading} aria-busy={loading}>

              <label htmlFor="file">
                Image
                <input
                  type="file"
                  id="file"
                  name="file"
                  placeholder="Upload an Image"
                  required
                  onChange={this.uploadFile} />
                  {this.state.image && <img width="15%" src={this.state.image} alt="Upload Preview"/> }
              </label>
              <label htmlFor="title">
                Title
                <input
                  type="text"
                  id="title"
                  name="title"
                  placeholder="Title"
                  required
                  value={this.state.title}
                  onChange={this.handleChange} />
              </label>
              <label htmlFor="price">
                Price
              <input
                type="number"
                id="price"
                name="price"
                placeholder="Price"
                required
                value={this.state.price}
                onChange={this.handleChange} />
                </label>
              <label htmlFor="description">
                Description
                <textarea
                  id="description"
                  name="description"
                  placeholder="Description"
                  required
                  value={this.state.description}
                  onChange={this.handleChange} />
              </label>

              <button type="submit">Submit</button>
            </fieldset>
          </Form>

        )}
      </Mutation>
    );
  }
}

export default CreateItem;
export { CREATE_ITEM_MUTATION };