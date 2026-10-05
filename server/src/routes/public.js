const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Optional auth — attaches userId if logged in, but doesn't require it
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
    }
  } catch (err) {
    // ignore invalid token — just treat as anonymous
  }
  next();
};

// ============ PUBLIC GALLERY ============

/**
 * List all public projects
 * GET /api/public/projects
 */
router.get('/projects', optionalAuth, async (req, res) => {
  try {
    const {
      search = '',
      sort = 'recent',
      language = '',
      tag = '',
      page = 1,
      limit = 24,
    } = req.query;

    const query = { isPublic: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { publishedDescription: { $regex: search, $options: 'i' } },
      ];
    }

    if (language) {
      query.githubLanguage = language;
    }

    if (tag) {
      query.tags = tag;
    }

    const sortMap = {
      recent: { publishedAt: -1 },
      popular: { likeCount: -1, publishedAt: -1 },
      oldest: { publishedAt: 1 },
      name: { name: 1 },
    };

    const sortObj = sortMap[sort] || sortMap.recent;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('owner', 'name email avatar')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-likes'),
      Project.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Get a single public project by ID
 * GET /api/public/projects/:id
 */
router.get('/projects/:id', optionalAuth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      isPublic: true,
    }).populate('owner', 'name email avatar');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found or not public' });
    }

    // Increment views
    await Project.findByIdAndUpdate(project._id, { $inc: { views: 1 } });

    // Check if current user liked it
    const isLiked = req.userId
      ? project.likes.some((id) => id.toString() === req.userId.toString())
      : false;

    const projectData = project.toJSON();
    projectData.isLiked = isLiked;
    delete projectData.likes;

    res.json({ success: true, data: projectData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Toggle like on a project
 * POST /api/public/projects/:id/like
 */
router.post('/projects/:id/like', optionalAuth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Login required to like' });
    }

    const project = await Project.findOne({ _id: req.params.id, isPublic: true });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const userId = req.userId.toString();
    const hasLiked = project.likes.some((id) => id.toString() === userId);

    if (hasLiked) {
      project.likes = project.likes.filter((id) => id.toString() !== userId);
    } else {
      project.likes.push(req.userId);
    }

    project.likeCount = project.likes.length;
    await project.save();

    res.json({
      success: true,
      data: {
        liked: !hasLiked,
        likeCount: project.likeCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ COMMENTS ============

/**
 * List comments for a project
 * GET /api/public/projects/:id/comments
 */
router.get('/projects/:id/comments', optionalAuth, async (req, res) => {
  try {
    const comments = await Comment.find({
      project: req.params.id,
      isDeleted: false,
    })
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Add comment to a project
 * POST /api/public/projects/:id/comments
 */
router.post('/projects/:id/comments', optionalAuth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Login required to comment' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content required' });
    }

    const project = await Project.findOne({ _id: req.params.id, isPublic: true });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const comment = await Comment.create({
      project: project._id,
      author: req.userId,
      content: content.trim(),
    });

    await Project.findByIdAndUpdate(project._id, { $inc: { commentCount: 1 } });

    await comment.populate('author', 'name email avatar');

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Delete own comment
 * DELETE /api/public/comments/:id
 */
router.delete('/comments/:id', optionalAuth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: 'Login required' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (comment.author.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    comment.isDeleted = true;
    await comment.save();

    await Project.findByIdAndUpdate(comment.project, { $inc: { commentCount: -1 } });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ AUTHOR PROFILE ============

/**
 * Get public profile of a project author
 * GET /api/public/authors/:id
 */
router.get('/authors/:id', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name avatar createdAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Author not found' });
    }

    const projects = await Project.find({
      owner: user._id,
      isPublic: true,
    })
      .sort({ publishedAt: -1 })
      .select('-likes')
      .limit(20);

    res.json({
      success: true,
      data: {
        author: user,
        projects,
        projectCount: projects.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;