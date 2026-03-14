const Content = require('../models/Content');

// GET /api/content — lista según rol
const getAll = async (req, res) => {
  try {
    const { role, id } = req.user;
    let filter = {};

    if (role === 'writer') filter.author = id;
    else if (role === 'editor') filter = { $or: [{ assignedEditor: id }, { status: 'pending_review' }] };
    else if (role === 'client') filter.status = 'published';
    // admin ve todo

    const contents = await Content.find(filter)
      .populate('author', 'name email')
      .populate('assignedEditor', 'name email')
      .sort({ updatedAt: -1 });

    res.json(contents);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener contenidos', error: err.message });
  }
};

// GET /api/content/:id
const getOne = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('author', 'name email')
      .populate('assignedEditor', 'name email')
      .populate('comments.author', 'name email');

    if (!content) return res.status(404).json({ message: 'Contenido no encontrado' });
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener contenido' });
  }
};

// POST /api/content
const create = async (req, res) => {
  try {
    const { title, body, type, tags, platform } = req.body;
    const content = await Content.create({
      title, body, type, tags, platform,
      author: req.user.id,
      status: 'draft',
    });
    res.status(201).json(content);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear contenido', error: err.message });
  }
};

// PUT /api/content/:id
const update = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ message: 'Contenido no encontrado' });

    // Solo el autor puede editar si está en draft o changes_requested
    if (
      req.user.role === 'writer' &&
      content.author.toString() !== req.user.id
    ) return res.status(403).json({ message: 'Sin permisos' });

    const allowed = ['draft', 'changes_requested'];
    if (!allowed.includes(content.status) && req.user.role === 'writer') {
      return res.status(400).json({ message: 'No puedes editar contenido en revisión o aprobado' });
    }

    const { title, body, type, tags, platform } = req.body;
    Object.assign(content, { title, body, type, tags, platform });
    await content.save();

    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar', error: err.message });
  }
};

// POST /api/content/:id/submit — writer envía a revisión
const submit = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ message: 'Contenido no encontrado' });
    if (content.author.toString() !== req.user.id) return res.status(403).json({ message: 'Sin permisos' });
    if (!['draft', 'changes_requested'].includes(content.status)) {
      return res.status(400).json({ message: 'El contenido ya fue enviado' });
    }

    content.status = 'pending_review';
    await content.save();
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Error al enviar a revisión' });
  }
};

// POST /api/content/:id/review — editor aprueba o pide cambios
const review = async (req, res) => {
  try {
    const { decision, feedback } = req.body; // decision: 'approve' | 'request_changes'
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ message: 'Contenido no encontrado' });
    if (content.status !== 'pending_review') {
      return res.status(400).json({ message: 'El contenido no está pendiente de revisión' });
    }

    if (decision === 'approve') {
      content.status = 'approved';
      content.assignedEditor = req.user.id;
    } else if (decision === 'request_changes') {
      content.status = 'changes_requested';
      if (feedback) {
        content.comments.push({ author: req.user.id, text: feedback });
      }
    } else {
      return res.status(400).json({ message: 'Decisión inválida' });
    }

    await content.save();
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Error al revisar contenido', error: err.message });
  }
};

// POST /api/content/:id/publish — editor publica
const publish = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ message: 'Contenido no encontrado' });
    if (content.status !== 'approved') {
      return res.status(400).json({ message: 'El contenido debe estar aprobado para publicar' });
    }

    content.status = 'published';
    content.publishedAt = new Date();
    await content.save();
    res.json(content);
  } catch (err) {
    res.status(500).json({ message: 'Error al publicar' });
  }
};

// POST /api/content/:id/comment
const addComment = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ message: 'Contenido no encontrado' });

    content.comments.push({ author: req.user.id, text: req.body.text });
    await content.save();
    await content.populate('comments.author', 'name email');
    res.json(content.comments);
  } catch (err) {
    res.status(500).json({ message: 'Error al agregar comentario' });
  }
};

module.exports = { getAll, getOne, create, update, submit, review, publish, addComment };