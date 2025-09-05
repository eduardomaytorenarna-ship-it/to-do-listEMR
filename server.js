const express = require('express');
const morgan = require('morgan');
const { body, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());
app.use(morgan('dev'));

let todos = [];

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, message, status = 400, details = null) =>
  res.status(status).json({ success: false, error: { message, ...(details ? { details } : {}) } });

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, 'Datos inválidos', 422, errors.array());
  next();
};

const createTodoValidator = [
  body('title')
    .exists().withMessage('title es requerido')
    .bail()
    .isString().withMessage('title debe ser texto')
    .trim()
    .isLength({ min: 1, max: 120 }).withMessage('title debe tener entre 1 y 120 caracteres'),
  handleValidation
];

const idParamValidator = [
  param('id').isUUID().withMessage('id debe ser un UUID válido'),
  handleValidation
];

const updateTodoValidator = [
  body('title')
    .optional()
    .isString().withMessage('title debe ser texto')
    .trim()
    .isLength({ min: 1, max: 120 }).withMessage('title debe tener entre 1 y 120 caracteres'),
  body('completed')
    .optional()
    .isBoolean().withMessage('completed debe ser booleano (true/false)'),
  handleValidation
];

app.post('/api/todos', createTodoValidator, (req, res) => {
  const { title } = req.body;
  const newTodo = {
    id: uuidv4(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  todos.push(newTodo);
  return ok(res, newTodo, 201);
});

app.get('/api/todos', (req, res) => {
  return ok(res, todos);
});

app.get('/api/todos/:id', idParamValidator, (req, res) => {
  const todo = todos.find(t => t.id === req.params.id);
  if (!todo) return fail(res, 'Tarea no encontrada', 404);
  return ok(res, todo);
});

app.put('/api/todos/:id', idParamValidator, updateTodoValidator, (req, res) => {
  const idx = todos.findIndex(t => t.id === req.params.id);
  if (idx === -1) return fail(res, 'Tarea no encontrada', 404);

  const before = todos[idx];
  const updated = {
    ...before,
    ...(req.body.title !== undefined ? { title: req.body.title } : {}),
    ...(req.body.completed !== undefined ? { completed: req.body.completed } : {}),
    updatedAt: new Date().toISOString()
  };

  todos[idx] = updated;
  return ok(res, updated);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

