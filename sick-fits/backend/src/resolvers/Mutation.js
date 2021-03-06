// ctx.db ALL METHODS IN PRISMA.GRAPHQL

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { transport, makeANiceEmail } = require('../mail');
const { hasPermission } = require('../utils');
const stripe = require('../stripe');

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in to do that');
    }

    const item = await ctx.db.mutation.createItem(
      {
        data: {
          // Relationship between Item and User
          user: {
            connect: {
              id: ctx.request.userId,
            },
          },
          ...args,
        },
      },
      info
    );

    return item;
  },
  updateItem(parent, args, ctx, info) {
    // Copy of the updates
    const updates = { ...args };
    // Remove the ID from the updates(COPY)
    // ID NOT "UPDATABLE"
    delete updates.id;
    // Run the update method
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: { id: args.id },
      },
      info
    );
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };

    // 1. Find the item
    const item = await ctx.db.query.item({ where }, `{ id, title, user {id} }`);

    // 2. Check if they own the item, or have permissions

    // Owner of item
    const ownsItem = (item.user.id = ctx.request.userId);

    // User attempting to make the change
    const currentUsersPermissions = ctx.request.user.permissions;
    const hasPermissions = currentUsersPermissions.some(permission =>
      ['ADMIN', 'ITEMDELETE'].includes(permission)
    );

    // Wrong Permissions - Throw Error
    if (!ownsItem && !hasPermissions) {
      throw new Error("You don't have permission to do that");
    }

    // 3. Delete it!
    return ctx.db.mutation.deleteItem({ where }, info);
  },
  async signup(parent, args, ctx, info) {
    // lowercase user email
    args.email = args.email.toLowerCase();
    // hash user password
    const password = await bcrypt.hash(args.password, 10);
    // create the user in the database
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ['USER'] },
        },
      },
      info
    );

    // create the JWT Token for the user
    // user.id inserted to Token as userId
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // Set JWT as a cookie on the response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });
    // Return the user to the browser
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    // 1. Check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // 2. Check if there password is correct. Compares hashes
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error(`Invalid Password`);
    }
    // 3. Generate the JWT Token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // 4. Set the cookie with the token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });
    // 5. Return the User
    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');
    return { message: 'Goodbye!' };
  },
  async requestReset(parent, args, ctx, info) {
    // 1. Check if real user
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
      throw new Error(`No such user found for email ${args.email}`);
    }
    // 2. Set a reset token and expiry on that user in the database
    const randomBytesPromisified = promisify(randomBytes);

    const resetToken = (await randomBytesPromisified(20)).toString('hex');

    const resetTokenExpiry = Date.now() + 3600000; // 1 hr from now

    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // 3. Email them a reset token
    const mailRes = await transport.sendMail({
      from: 'mariob360@gmail.com',
      to: user.email,
      subject: 'Your Password',
      html: makeANiceEmail(`Your password Reset Token is here! \n\n
      <a
        href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">
        Click Here to Reset
      </a> `),
    });
    // 4. Return the message
    return { message: 'Check email for password reset' };
  },
  async resetPassword(parent, args, ctx, info) {
    // 1. Check if the passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error("Your passwords don't match");
    }
    // 2. Check if its a legit reset token
    // 3. Check if token expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        // Check if token within 1hr time limit
        // Reset token be greater than Date.now() - 3600000
        resetTokenExpiry_gte: Date.now() - 3600000,
      },
    });
    if (!user) {
      throw new Error('This token is either invalid or expired!');
    }
    // 4. Hash their new password
    const password = await bcrypt.hash(args.password, 10);
    // 5. Save the new password to the user and remove old reset token fields
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    // 6. Generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // 7. Set the JWT Cookie for the newly signed in user
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    // 8. return the new user
    return updatedUser;
  },
  async updatePermissions(parent, args, ctx, info) {
    // Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in!');
    }
    // Query the current user
    const currentUser = await ctx.db.query.user(
      {
        where: {
          id: ctx.request.userId,
        },
      },
      info
    );
    // Check if user has permissions to change others permissions
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
    // Update the permissions
    return ctx.db.mutation.updateUser(
      {
        data: {
          // permissions has its own ENUM so using 'set'
          permissions: {
            set: args.permissions,
          },
        },
        where: {
          // Using args rather than ctx.
          // User may be updating someone elses permissions
          id: args.userId,
        },
      },
      info
    );
  },
  async addToCart(parent, args, ctx, info) {
    // 1. Make sure they are signed in
    const { userId } = ctx.request;
    if (!userId) {
      throw new Error('You must be signed in!');
    }

    console.log(userId, args.id);
    // 2. Query the users current cart (query all items at once)
    // First item to return using the unique userId should be the users
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id },
      },
    });

    // 3. Check if item is already in the users cart
    // and update the item by 1 if it is
    if (existingCartItem) {
      console.log('This item is already in your cart');
      return ctx.db.mutation.updateCartItem(
        {
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + 1 },
        },
        info
      );
    }
    // 4. If its not then create am item for that user
    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: { id: userId },
          },
          item: {
            connect: { id: args.id },
          },
        },
      },
      info
    );
  },
  async removeFromCart(parent, args, ctx, info) {
    // 1. Find the cart item
    const cartItem = await ctx.db.query.cartItem(
      {
        where: {
          id: args.id,
        },
      },
      // return item id and the owners id
      `{ id, user, { id } }`
    );
    if (!cartItem) return new Error('No cart item found!');
    // 2. Make sure they own that cart item
    if (cartItem.user.id !== ctx.request.userId) {
      throw new Error('You do not own that item!');
    }
    // 3. Delete the cart item
    return ctx.db.mutation.deleteCartItem(
      {
        where: {
          id: args.id,
        },
      },
      info
    );
  },
  async createOrder(parent, args, ctx, info) {
    // 1. Query the current user and make sure they are signed in
    const { userId } = ctx.request;
    if (!userId) throw new Error('You must be signed in to complete this order.');

    const user = await ctx.db.query.user(
      { where: { id: userId } },
      `{
      id
      name
      email
      cart {
        id
        quantity
        item {
          title
          price
          id
          description
          image
          largeImage
          }
        }
      }
      `
    );

    // 2. Recalculate the total for the price (prevent user from changing total price of cart)
    const amount = user.cart.reduce(
      (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity,
      0
    );

    console.log(`Going to charge for a total of ${amount}`);

    // 3. Create the stripe charge (turn token into $$$)
    const charge = await stripe.charges.create({
      amount,
      currency: 'USD',
      source: args.token,
    });

    // 4. Convert the CartItems to OrderItems (copy of current state of the items)
    const orderItems = user.cart.map(cartItem => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: { connect: { id: userId } },
      };
      delete orderItem.id;
      return orderItem;
    });

    // 5. Create the Order
    const order = await ctx.db.mutation.createOrder({
      data: {
        // charge comes back from stripe
        total: charge.amount,
        charge: charge.id,
        // creates OrderItem out of orderItems
        items: { create: orderItems },
        // connect will create a relation
        user: { connect: { id: userId } },
      },
    });

    // 6. Clear the Users Cart - Delete CartItems
    const cartItemIds = user.cart.map(cartItem => cartItem.id);

    await ctx.db.mutation.deleteManyCartItems({
      where: {
        // accepts array of items[id]
        id_in: cartItemIds,
      },
    });

    // 7. Return the order to the client
    return order;
  },
};

module.exports = Mutations;
