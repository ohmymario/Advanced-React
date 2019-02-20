// ctx.db ALL METHODS IN PRISMA.GRAPHQL

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');


const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: check if they are logged in

    const item = await ctx.db.mutation.createItem({
      data: {
        ...args
      }
    }, info);

    return item;
  },
  updateItem(parent, args, ctx, info) {
    // Copy of the updates
    const updates = { ...args };
    // Remove the ID from the updates(COPY)
    // ID NOT "UPDATABLE"
    delete updates.id
    // Run the update method
    return ctx.db.mutation.updateItem({
      data: updates,
      where: { id: args.id }
    }, info)
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };

    // 1. Find the item
    const item = await ctx.db.query.item({ where }, `{ id, title }`)

    // 2. Check if they own the item, or have permissions
    // TODO

    // 3. Delete it!
    return ctx.db.mutation.deleteItem({ where }, info)
  },
  async signup(parent, args, ctx, info) {
    // lowercase user email
    args.email = args.email.toLowerCase();
    // hash user password
    const password = await bcrypt.hash(args.password, 10);
    // create the user in the database
    const user = await ctx.db.mutation.createUser({
      data: {
        ...args,
        password,
        permissions: { set: ['USER'] },
      }
    }, info);

    // create the JWT Token for the user
    // user.id inserted to Token as userId
    const token = jwt.sign({userId: user.id}, process.env.APP_SECRET);
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
    const user = await ctx.db.query.user({ where: { email }});
    if(!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // 2. Check if there password is correct. Compares hashes
    const valid = await bcrypt.compare(password, user.password);
    if(!valid) {
      throw new Error(`Invalid Password`)
    }
    // 3. Generate the JWT Token
    const token = jwt.sign({userId: user.id}, process.env.APP_SECRET);
    // 4. Set the cookie with the token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    })
    // 5. Return the User
    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');
    return { message: 'Goodbye!' };
  },
  async requestReset(parent, args, ctx, info) {
    // 1. Check if real user
    const user = await ctx.db.query.user({ where: { email: args.email }});
    if(!user) {
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
        resetTokenExpiry
      }
    })

    console.log(`resetToken ${resetToken}`)
    console.log(`resetTokenExpiry ${resetTokenExpiry}`);
    console.log(res);

    return { message: 'Check email for reset' };
    // 3. Email them a reset token
  },
  async resetPassword(parent, args, ctx, info) {
    // 1. Check if the passwords match
    if(args.password !== args.confirmPassword) {
      throw new Error('Your passwords don\'t match')
    }
    // 2. Check if its a legit reset token
    // 3. Check if token expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        // Check if token within 1hr time limit
        // Reset token be greater than Date.now() - 3600000
        resetTokenExpiry_gte: Date.now() - 3600000
      }
    });
    if(!user) {
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
      }
    })
    // 6. Generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // 7. Set the JWT Cookie for the newly signed in user
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    })
    // 8. return the new user
    return updatedUser;
  }
};

module.exports = Mutations;
