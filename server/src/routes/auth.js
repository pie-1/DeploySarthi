const express = require('express')
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
    return jwt.sign(
        {id},
        process.env.JWT_SECRETS || 'secret123',
        {expiresIn:'30d'});
}

//Register
router.post('/register', async(req,res) => {
    try{
        const {name,email,password} = req.body;
        const userExists = await User.findOne({email});
        if (userExists) return res.status(400).json({success: false, message:'user already exists'});

        const user = await User.create({name,email,password});
        res.status(201).json({
            success: true,
            data: {_id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id)}
        });
    }catch(error){
        res.status(500).json({ success: false, message: error.message });
    }
})

//login
router.post('/login', async(req,res) => {
    try{
        const {email,password} = req.body;
        const user = await User.findOne({email});
        if(!user) return res.status(401).json({success: false, message : 'Invalid credentials'});

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            }
        });
    }catch(error){
        res.status(500).json({ success: false, message: error.message });
    }
});

//getting current user
router.get('/me', async(req,res) => {
    try{
        const token = req.headers.authorization?.split(' ')[1];
        if(!token) return res.status(401).json({success: false, message: 'no token'});

        const decoded = jwt.verify(token, process.env.JWT_SECRETS || 'secret123');
        const user = await User.findById(decoded.id).populate('projects');
        res.json({success:true, data: user})
    }catch(error){
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

module.exports = router;
