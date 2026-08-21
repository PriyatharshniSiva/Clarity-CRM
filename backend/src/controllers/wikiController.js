const prisma = require('../utils/db');

exports.createWikiPage = async (req, res) => {
  try {
    const { title, content, teamId } = req.body;
    const authorId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const newPage = await prisma.wikiPage.create({
      data: {
        title,
        content,
        authorId,
        teamId: teamId || null,
      },
      include: {
        author: { select: { name: true } }
      }
    });

    res.status(201).json({ message: 'Wiki page created successfully', data: newPage });
  } catch (error) {
    console.error('Error creating wiki page:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getWikiPages = async (req, res) => {
  try {
    const { teamId } = req.query;
    
    const where = {};
    if (teamId) {
      where.teamId = teamId;
    } else {
      where.teamId = null; // Maybe global workspace
    }

    const pages = await prisma.wikiPage.findMany({
      where,
      include: {
        author: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ data: pages });
  } catch (error) {
    console.error('Error fetching wiki pages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getWikiPageById = async (req, res) => {
  try {
    const { id } = req.params;

    const page = await prisma.wikiPage.findUnique({
      where: { id },
      include: {
        author: { select: { name: true } }
      }
    });

    if (!page) {
      return res.status(404).json({ message: 'Wiki page not found' });
    }

    res.status(200).json({ data: page });
  } catch (error) {
    console.error('Error fetching wiki page:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateWikiPage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const existingPage = await prisma.wikiPage.findUnique({ where: { id } });
    if (!existingPage) {
      return res.status(404).json({ message: 'Wiki page not found' });
    }

    const updatedPage = await prisma.wikiPage.update({
      where: { id },
      data: {
        title: title || existingPage.title,
        content: content || existingPage.content,
      },
      include: {
        author: { select: { name: true } }
      }
    });

    res.status(200).json({ message: 'Wiki page updated successfully', data: updatedPage });
  } catch (error) {
    console.error('Error updating wiki page:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.deleteWikiPage = async (req, res) => {
  try {
    const { id } = req.params;

    const existingPage = await prisma.wikiPage.findUnique({ where: { id } });
    if (!existingPage) {
      return res.status(404).json({ message: 'Wiki page not found' });
    }

    await prisma.wikiPage.delete({ where: { id } });

    res.status(200).json({ message: 'Wiki page deleted successfully' });
  } catch (error) {
    console.error('Error deleting wiki page:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
