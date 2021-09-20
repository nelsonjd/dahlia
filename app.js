const express = require('express');
const expressJWT = require('express-jwt');
const jsonwebtoken = require('jsonwebtoken');
const { buildSchema } = require('graphql');
const { graphqlHTTP } = require('express-graphql');
const { userRespository } = require('./repositories/userRepository');
const { authorizeContext } = require('./models/authentication');
const bcrypt = require('bcrypt');

const app = express();

const schema = buildSchema(`
    type Query {
        rollDice(numDice: Int!, numSides: Int): [Int]
    }

    type Mutation {
        login(username: String!, password: String!): AuthPayload
        token(refreshToken: String!): AuthPayload
        signUp(username: String!, password: String!): AuthPayload
        logout(refreshToken: String!): AuthPayload
    }

    type User {
        id: ID!
        username: String!
    }

    type AuthPayload {
        refreshToken: String
        accessToken: String
        user: User
    }
`);

const root = {
    rollDice: (args, context, info) =>
    {
        authorizeContext(context);

        var output = [];
        var numSides = args.numSides || 6;
        for (var i = 0; i < args.numDice; ++i)
        {
            output.push(1 + Math.floor(Math.random() * numSides));
        }
        return output;
    },
    token: async (args, context, info) =>
    {
        const { refreshToken } = args;

        let decoded;
        try {
            decoded = jsonwebtoken.verify(refreshToken, refreshTokenSecret);
        }
        catch (err)
        {
            throw new Error('bad token');
        }

        const id = parseInt(decoded.sub);

        const { user } = await userRespository.findById({ id });

        if (!user || user.refreshToken !== refreshToken)
        {
            throw new Error('unauthorized');
        }

        const accessToken = jsonwebtoken.sign(
            {
                username: user.username,
                sub: user.id.toString()
            },
            accessTokenSecret,
            { expiresIn: '20m' }
        );
        
        const payload =  {
            accessToken,
            user: {
                id: user.id.toString(),
                username: user.username
            }
        };

        return payload;
    },
    login: async (args) => {
        const { username, password } = args;

        const { user } = await userRespository.findByUsername({
            username: username,
            password: password
        })

        if (!user)
        {
            throw new Error('User not found');
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            throw new Error ('Invalid password');
        }

        const refreshToken = jsonwebtoken.sign(
            {
                sub: user.id.toString()
            },
            refreshTokenSecret
        );

        user.refreshToken = refreshToken;
        await userRespository.updateRefreshToken(user);

        return {
            refreshToken,
            user
        };
    },
    logout: async (args) => {
        const { refreshToken } = args;

        let decoded;
        try {
            decoded = jsonwebtoken.verify(refreshToken, refreshTokenSecret);
        }
        catch (err)
        {
            throw new Error('bad token');
        }

        const id = parseInt(decoded.sub);

        const { user } = await userRespository.findById({ id });

        if (!user || user.refreshToken !== refreshToken)
        {
            throw new Error('unauthorized');
        }

        user.refreshToken = null;
        await userRespository.updateRefreshToken(user);

        const payload =  {
            user: {
                id: user.id.toString(),
                username: user.username
            }
        };

        return payload;
    },
    signUp: async (args) => {
        const password = await bcrypt.hash(args.password, 10);
        const username = args.username;

        const { user, connection } = await userRespository.findByUsername({
            username: username
        }, null, true).catch(err =>
        {
            throw err;
        });
        
        if (user) {
            throw new Error('user already exists');
        }
        
        const { id } = await userRespository.create({
            username: username,
            password: password
        }, connection, true).catch(err =>
        {
            throw err;
        });

        if (!id) throw new Error('insert id is null');

        const refreshToken = jsonwebtoken.sign(
            { sub: id.toString() },
            refreshTokenSecret
        );

        await userRespository.updateRefreshToken({id, refreshToken}, connection);
            
        return {
            refreshToken,
            user: {
                id,
                username: args.username
            }
        };
    }
};

const accessTokenSecret = 'accesstokensecret';
const refreshTokenSecret = 'refreshtokensecret';

app.use(expressJWT({
    secret: accessTokenSecret,
    algorithms: ['HS256'],
    credentialsRequired: false
}));

app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
}));

app.use(function (err, req, res, next)
{
    if (err.name === 'UnauthorizedError')
    {
        res.send(401);
    }
});

app.listen(8080, () => {
    console.log('Dahlia has been started on port 8080');
});