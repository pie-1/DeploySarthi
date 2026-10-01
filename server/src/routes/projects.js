const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');

// get all projects from user
router.get('/', async(req,res) => {
    try{
        const projects = await Project.find({owner: req.userId}).sort({createdAt:-1});
        res.json({success:true, data: projects});
    }catch(error){
        res.status(500).json({ success: false, message: error.message });
    }
});

//create projects
router.get('/',async(req,res) => {
    try{
        const project = await Project.create({ ...req.body, owner: req.userId});
        await User.findByIdAndUpdate(req.userId, {$push: { projects:project._id}});
        res.status(201).json({success: true, data: project});
    }catch(error){
        res.status(500).json({ success: false, message: error.message });
    }
})

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.userId });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;