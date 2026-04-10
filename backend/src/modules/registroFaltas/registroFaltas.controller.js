const model = require('./registroFaltas.model');

const create = async (req, res) => {
  try {
    const data = req.body;

    const result = await model.create(data);

    res.status(201).json(result);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👇 NUEVO
const getAll = async (req, res) => {
  try {
    const result = await model.getAll();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const result = await model.updateEstado(id, estado);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { create, getAll, updateEstado };