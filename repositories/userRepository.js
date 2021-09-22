const { prisma } = require('../models/client');

class UserRepository
{
    async findByUsername(user) 
    {
        const foundUser = await prisma.user.findFirst({
            where: {
                username: user.username
            }
        });
        return foundUser;
    }
    
    async findById(user)
    {
        const foundUser = await prisma.user.findFirst({
            where: {
                id: user.id
            }
        });
        return foundUser;
    }
    
    async create(user) 
    {
        const createdUser = await prisma.user.create({
            data: {
                username: user.username,
                password: user.password
            }
        });
        return createdUser;
    }


    async update(user)
    {
        const updatedUser = await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                refreshToken: user.refreshToken
            }
        });

        return updatedUser;
    }
}


module.exports.userRespository = new UserRepository();